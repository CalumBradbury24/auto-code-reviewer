import OpenAI from 'openai';
import './config';
import logger from 'logger';

const client = new OpenAI({
    baseURL: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
    apiKey: 'lm-studio' // LM Studio doesn't validate this, but SDK requires it
});

async function checkModelReadyStatus(modelId: OpenAI.Models.Model['id']) {
    if (!modelId) throw new Error('LM_STUDIO_MODEL not configured');

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
            if (isReady) {
                return model;
            }
        } catch (error) {
            // This model isn't ready, continue to next one
            continue;
        }
    }

    throw new Error('No models currently available');
}


export const ensureModelReady = async () => {
    const availableModels = await client.models.list();
    const reviewModels = process.env.REVIEW_MODELS?.split(',') || [];

    const validModels = availableModels.data.filter((model) => reviewModels.includes(model.id));

    return await getFirstReadyModel(validModels);
};
export const getCodeReview = async () => {
    if (!process.env.REVIEW_MODELS?.length) throw new Error('Must provide at least one valid LLM in config for the review');
    // const response = await client.chat.completions.create({
    //     model: process.env.LM_STUDIO_MODEL || 'local-model',
    //     messages: [
    //         { role: 'system', content: 'You are a code reviewer...' },
    //         { role: 'user', content: `Review this diff:\n\n${diff}` }
    //     ],
    //     temperature: 0.7,
    //     max_tokens: 2000
    // });

    // const reviewContent = response.choices[0].message.content;
};
