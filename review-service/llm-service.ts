import OpenAI from 'openai';
import '../config';
import logger from 'logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CodeReviewResult } from './types';

let availableReviewModel: string;

const client = new OpenAI({
    baseURL: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
    apiKey: 'lm-studio' // LM Studio doesn't validate this, but SDK requires it
});

// Load the code review prompt from file
const SYSTEM_PROMPT = readFileSync(
    join(process.cwd(), 'prompts/code-review-prompt.md'),
    'utf-8'
);

async function checkModelReadyStatus(modelId: OpenAI.Models.Model['id']) {
    if (!modelId) logger.warn(`local llm with id ${modelId} not configured`);

    logger.info(`Checking if model "${modelId}" is loaded...`);

    try {
        // Make a minimal test request
        await client.chat.completions.create({
            model: modelId,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1
        });

        logger.info(`✓ Model "${modelId}" loaded and ready`);
        return true;
    } catch (error) {
        logger.warn(`✗ Model "${modelId}" is not loaded or not responding`);
        return false;
    }
}

async function getFirstReadyModel(models: OpenAI.Models.Model[]) {
    for (const model of models) {
        try {
            const isReady = await checkModelReadyStatus(model.id);
            if (isReady) return model;
        } catch (error) {
            // This model isn't ready, continue to next one
            continue;
        }
    }

    throw new Error('No models currently available');
}


export const ensureModelReady = async () => {
    const availableModels = await client.models.list(); // Fetch all available models
    const reviewModels = process.env.REVIEW_MODELS?.split(',') || [];

    // Trim down to models to use for review
    const validModels = availableModels.data.filter((model) => reviewModels.includes(model.id));

    const reviewModel = await getFirstReadyModel(validModels);
    availableReviewModel = reviewModel.id;
    return reviewModel;
};

function extractJSON(text: string) {
    // Try to find JSON in markdown code blocks first
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch?.[1]) return codeBlockMatch[1];

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];

    return text;
}

export const getCodeReview = async (diffs: string) => {
    if (!process.env.REVIEW_MODELS?.length) throw new Error('Must provide at least one valid LLM in config for the review');

    const response = await client.chat.completions.create({
        model: availableReviewModel,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT }, // Sets the AI's behviour/personality etc
            { role: 'user', content: `Review the following code changes:\n\n${diffs}` } // Actual prompt with code review request
        ],
        max_tokens: 2000,
        temperature: 0, // More deterministic responses
    });

    const rawReviewContent = response.choices[0]?.message.content;
    if (!rawReviewContent) throw new Error('No response content received from LLM for review');

    try {
        // The model can sometimes return JSON in markdown like ```json {key: value}```, so we need to parse this to extract the raw JSON
        const parsedReview: CodeReviewResult = JSON.parse(extractJSON(rawReviewContent));
        console.log('REVIEW --->>> ', parsedReview)
        return parsedReview;
    } catch (error) {
        logger.error('Failed to parse JSON:', error);
        logger.error('Raw response:', rawReviewContent);
        throw error;
    }
};
