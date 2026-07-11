export type ReviewComment = {
    path: string;
    line: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    body: string;
};

export type CodeReviewResult = {
    summary: string;
    overallRecommendation: 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';
    comments: ReviewComment[];
    positives: string[];
};
