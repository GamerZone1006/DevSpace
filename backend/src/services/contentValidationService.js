const TECH_KEYWORDS = [
    "javascript",
    "typescript",
    "react",
    "reactjs",
    "node",
    "nodejs",
    "express",
    "mongodb",
    "mysql",
    "postgresql",
    "sql",
    "python",
    "java",
    "c++",
    "c#",
    "golang",
    "rust",
    "html",
    "css",
    "tailwind",
    "bootstrap",
    "nextjs",
    "angular",
    "vue",
    "git",
    "github",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "api",
    "rest",
    "graphql",
    "database",
    "backend",
    "frontend",
    "fullstack",
    "devops",
    "cloud",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "ai",
    "data science",
    "data structures",
    "algorithms",
    "dsa",
    "cybersecurity",
    "networking",
    "operating system",
    "os",
    "dbms",
    "software engineering",
    "programming",
    "coding",
    "developer",
    "development",
    "leetcode",
    "hackathon"
];

const normalizeText = (text = "") => {
    return text
        .toLowerCase()
        .replace(/[^\w\s+#.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const calculateKeywordScore = (text) => {
    const normalizedText = normalizeText(text);

    if (!normalizedText) {
        return 0;
    }

    let matches = 0;

    for (const keyword of TECH_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
            matches++;
        }
    }

    return Math.min(matches / 5, 1);
};

const validateContent = ({
    caption = "",
    hashtags = [],
    technologyTags = [],
    transcript = "",
    ocrText = ""
}) => {

    const hashtagText = hashtags.join(" ");
    const technologyText = technologyTags.join(" ");

    const combinedText = [
        caption,
        hashtagText,
        technologyText,
        transcript,
        ocrText
    ].join(" ");

    const score = calculateKeywordScore(combinedText);

    return {
        score: Number(score.toFixed(3)),
        decision: "ready",
        analyzedText: combinedText
    };
};

module.exports = {
    validateContent,
    calculateKeywordScore
};