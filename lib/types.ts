// Type definitions for Cloud Armor Dashboard V2

export interface CloudArmorRule {
    projectName: string;
    policyName: string;
    targetCount: number;
    targetList: string;
    adaptiveProtection: boolean;
    logLevel: string;
    jsonParsing: string;
    rulesActive: string;
    status: string;
    matchExpression: string;
    ruleDescription: string;
    priority: number;
}

export interface KPIMetrics {
    totalProjects: number;
    totalPolicies: number;
    wafCoverage: number;
    criticalRules: number;
    totalRules: number;
}

export interface ProjectAnalysis {
    name: string;
    policyCount: number;
    ruleCount: number;
    adaptiveProtectionCount: number;
    denyRules: number;
    allowRules: number;
    throttleRules: number;
    policies: string[];
    rules: CloudArmorRule[];
}

export interface AttackVectorData {
    label: string;
    count: number;
    color: string;
}

export interface ActionDistributionData {
    action: string;
    count: number;
    color: string;
}

export interface ProjectPolicyCount {
    project: string;
    policyCount: number;
}

export type AttackCategory =
    | 'SQLi'
    | 'XSS'
    | 'LFI'
    | 'RFI'
    | 'RCE'
    | 'PHP/Node.js'
    | 'Protocol Attack'
    | 'Scanners'
    | 'Session Fixation'
    | 'Java'
    | 'Rate Limiting'
    | 'IP Lists'
    | 'Method Enforcement'
    | 'Default Rule'
    | 'Other';

export interface DashboardState {
    rules: CloudArmorRule[];
    selectedProject: string | null;
    selectedPolicy: string | null;
    searchQuery: string;
    actionFilter: string | null;
    currentPage: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}
