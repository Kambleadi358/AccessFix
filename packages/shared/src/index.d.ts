export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type WCAGPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
export type ViolationSeverity = 'Critical' | 'Major' | 'Minor';
export interface Violation {
    /** Unique rule identifier */
    ruleId: string;
    /** WCAG success criterion reference */
    wcag: string;
    /** WCAG conformance level */
    level: WCAGLevel;
    /** POUR principle */
    principle: WCAGPrinciple;
    /** Human-readable title */
    title: string;
    /** Severity classification */
    severity: ViolationSeverity;
    /** CSS selector */
    selector: string;
    /** Violation description */
    message: string;
    /** HTML snippet causing issue */
    htmlSnippet?: string;
    /** Fix guidance */
    howToFix: string;
    /** Can auto-fix be applied */
    fixable: boolean;
    /** Confidence score */
    fixConfidence?: number;
    /** Optional computed styles */
    computedStyles?: Record<string, string>;
}
export interface AIFixSuggestion {
    ruleId: string;
    originalHtml: string;
    fixedHtml: string;
    explanation: string;
    accessibilityImpact: string;
    confidence: number;
}
export interface AccessibilityScore {
    overall: number;
    byPrinciple: Record<WCAGPrinciple, number>;
    violationCounts: {
        critical: number;
        major: number;
        minor: number;
        total: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    passRate: number;
}
export interface ScanResult {
    scanId: string;
    url: string;
    scannedAt: string;
    durationMs: number;
    score: AccessibilityScore;
    violations: Violation[];
    aiSuggestions: AIFixSuggestion[];
    screenshotPath?: string;
    pageTitle?: string;
    pageLanguage?: string;
    status: 'completed' | 'failed' | 'partial';
    error?: string;
}
export interface Report {
    reportId: string;
    scanId: string;
    format: 'json' | 'pdf' | 'csv';
    generatedAt: string;
    filePath?: string;
}
export interface ScanRequest {
    url: string;
    options?: ScanOptions;
}
export interface ScanOptions {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    viewportWidth?: number;
    viewportHeight?: number;
    captureScreenshot?: boolean;
    enableAI?: boolean;
    aiProvider?: 'openai' | 'claude' | 'none';
    timeout?: number;
    skipRules?: string[];
}
export interface RuleDefinition {
    id: string;
    wcag: string;
    level: WCAGLevel;
    principle: WCAGPrinciple;
    title: string;
    description: string;
    severity: ViolationSeverity;
    tags: string[];
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface DbScan {
    id: string;
    url: string;
    scanned_at: string;
    duration_ms: number;
    overall_score: number;
    grade: string;
    pass_rate: number;
    critical_count: number;
    major_count: number;
    minor_count: number;
    status: string;
    error?: string;
    screenshot_path?: string;
    page_title?: string;
    page_language?: string;
    raw_result: string;
}
export interface DbViolation {
    id: string;
    scan_id: string;
    rule_id: string;
    wcag: string;
    level: string;
    principle: string;
    title: string;
    severity: string;
    selector: string;
    message: string;
    how_to_fix: string;
    fixable: number;
    htmlSnippet?: string;
}
export interface DbAISuggestion {
    id: string;
    scan_id: string;
    rule_id: string;
    original_html: string;
    fixed_html: string;
    explanation: string;
    accessibility_impact: string;
    confidence: number;
}
export interface ScanStats {
    totalScans: number;
    averageScore: number;
    mostCommonViolations: Array<{
        ruleId: string;
        count: number;
    }>;
    scoreDistribution: Array<{
        range: string;
        count: number;
    }>;
    recentScans: ScanResult[];
}
