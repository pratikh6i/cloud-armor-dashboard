import Papa from 'papaparse';
import { CloudArmorRule, KPIMetrics, AttackVectorData, ActionDistributionData, ProjectPolicyCount, AttackCategory, ProjectAnalysis } from './types';

// Convert pubhtml URL to CSV export URL
export function convertToCSVUrl(url: string): string {
    // Handle various Google Sheets URL formats
    let csvUrl = url.trim();

    // If it's already a CSV URL, return as is
    if (csvUrl.includes('output=csv')) {
        return csvUrl;
    }

    // Convert pubhtml to CSV
    if (csvUrl.includes('/pubhtml')) {
        csvUrl = csvUrl.replace('/pubhtml', '/pub?output=csv');
    } else if (csvUrl.includes('/pub?')) {
        // Add output=csv if not present
        if (!csvUrl.includes('output=')) {
            csvUrl += '&output=csv';
        } else {
            csvUrl = csvUrl.replace(/output=\w+/, 'output=csv');
        }
    } else if (csvUrl.includes('/edit')) {
        // Convert edit URL to export
        csvUrl = csvUrl.replace('/edit', '/export?format=csv');
    }

    return csvUrl;
}

// Parse raw CSV row to CloudArmorRule
function parseRow(row: Record<string, string>): CloudArmorRule | null {
    try {
        const projectName = row['Project Name']?.trim() || '';
        const policyName = row['Policy Name']?.trim() || '';

        if (!projectName || !policyName) return null;

        return {
            projectName,
            policyName,
            targetCount: parseInt(row['Target Count'] || '0', 10) || 0,
            targetList: row['Target List (Pipe Separated)']?.trim() || 'None',
            adaptiveProtection: row['Adaptive Protection']?.toUpperCase() === 'TRUE',
            logLevel: row['Log Level']?.trim() || 'Standard',
            jsonParsing: row['JSON Parsing']?.trim() || 'Disabled',
            rulesActive: row['Rules active or in preview']?.trim() || 'Active',
            status: row['Status']?.trim() || '',
            matchExpression: row['Match Expression']?.trim() || '',
            ruleDescription: row['Rule Description']?.trim() || '',
            priority: parseInt(row['Priority'] || '0', 10) || 0,
        };
    } catch (error) {
        console.error('Error parsing row:', error, row);
        return null;
    }
}

// Parse CSV text to rules
export function parseCSVText(csvText: string): Promise<CloudArmorRule[]> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rules = results.data
                    .map(parseRow)
                    .filter((rule): rule is CloudArmorRule => rule !== null);
                resolve(rules);
            },
            error: (error: Error) => {
                console.error('CSV parse error:', error);
                reject(error);
            },
        });
    });
}

// Fetch and parse CSV from URL (client-side)
export async function fetchFromURL(url: string): Promise<CloudArmorRule[]> {
    const csvUrl = convertToCSVUrl(url);

    try {
        const response = await fetch(csvUrl, {
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Access denied. Please ensure your Google Sheet is "Published to the web" as CSV format and visible to "Anyone with the link".');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();

        // Check if we got HTML instead of CSV
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
            throw new Error('Google Sheets returned HTML instead of CSV. Please check that you published the sheet to the web and selected "Comma-separated values (.csv)" format.');
        }

        const rules = await parseCSVText(csvText);

        if (rules.length === 0) {
            throw new Error('No valid data found in the sheet. Please check the column headers match: Project Name, Policy Name, Status, Match Expression, etc.');
        }

        return rules;
    } catch (error) {
        console.error('Error fetching from URL:', error);
        throw error;
    }
}

// Advanced query parser
export function parseAdvancedQuery(rules: CloudArmorRule[], query: string): CloudArmorRule[] {
    if (!query.trim()) return rules;

    const normalizedQuery = query.trim();

    // Split by AND/OR while preserving the operators
    const parts: { term: string; operator: 'AND' | 'OR' | 'START' }[] = [];
    let currentPart = '';
    let lastOperator: 'AND' | 'OR' | 'START' = 'START';

    const words = normalizedQuery.split(/\s+/);

    for (const word of words) {
        if (word.toUpperCase() === 'AND') {
            if (currentPart.trim()) {
                parts.push({ term: currentPart.trim(), operator: lastOperator });
            }
            currentPart = '';
            lastOperator = 'AND';
        } else if (word.toUpperCase() === 'OR') {
            if (currentPart.trim()) {
                parts.push({ term: currentPart.trim(), operator: lastOperator });
            }
            currentPart = '';
            lastOperator = 'OR';
        } else {
            currentPart += (currentPart ? ' ' : '') + word;
        }
    }

    if (currentPart.trim()) {
        parts.push({ term: currentPart.trim(), operator: lastOperator });
    }

    if (parts.length === 0) return rules;

    // Process each part
    const matchesTerm = (rule: CloudArmorRule, term: string): boolean => {
        const isNegated = term.toUpperCase().startsWith('NOT ');
        const cleanTerm = isNegated ? term.substring(4).trim() : term;

        let matches = false;

        // Check for field-specific queries
        if (cleanTerm.includes(':')) {
            const [field, value] = cleanTerm.split(':').map(s => s.trim().toLowerCase());

            switch (field) {
                case 'project':
                    matches = rule.projectName.toLowerCase().includes(value);
                    break;
                case 'policy':
                    matches = rule.policyName.toLowerCase().includes(value);
                    break;
                case 'action':
                case 'status':
                    matches = rule.status.toLowerCase().includes(value);
                    break;
                case 'priority':
                    if (value.startsWith('<')) {
                        matches = rule.priority < parseInt(value.substring(1), 10);
                    } else if (value.startsWith('>')) {
                        matches = rule.priority > parseInt(value.substring(1), 10);
                    } else {
                        matches = rule.priority === parseInt(value, 10);
                    }
                    break;
                case 'adaptive':
                    matches = value === 'true' ? rule.adaptiveProtection : !rule.adaptiveProtection;
                    break;
                case 'expression':
                case 'match':
                    matches = rule.matchExpression.toLowerCase().includes(value);
                    break;
                case 'description':
                case 'desc':
                    matches = rule.ruleDescription.toLowerCase().includes(value);
                    break;
                default:
                    // Unknown field, search all
                    matches = searchAllFields(rule, value);
            }
        } else {
            // General search across all fields
            matches = searchAllFields(rule, cleanTerm.toLowerCase());
        }

        return isNegated ? !matches : matches;
    };

    // Start with first term
    let result = rules.filter(rule => matchesTerm(rule, parts[0].term));

    // Apply subsequent terms with their operators
    for (let i = 1; i < parts.length; i++) {
        const { term, operator } = parts[i];
        const termMatches = rules.filter(rule => matchesTerm(rule, term));

        if (operator === 'AND') {
            result = result.filter(rule => termMatches.includes(rule));
        } else if (operator === 'OR') {
            const resultSet = new Set(result);
            termMatches.forEach(rule => resultSet.add(rule));
            result = Array.from(resultSet);
        }
    }

    return result;
}

function searchAllFields(rule: CloudArmorRule, term: string): boolean {
    return (
        rule.projectName.toLowerCase().includes(term) ||
        rule.policyName.toLowerCase().includes(term) ||
        rule.ruleDescription.toLowerCase().includes(term) ||
        rule.matchExpression.toLowerCase().includes(term) ||
        rule.status.toLowerCase().includes(term) ||
        String(rule.priority).includes(term)
    );
}

// Calculate KPI metrics
export function calculateKPIMetrics(rules: CloudArmorRule[]): KPIMetrics {
    const uniqueProjects = new Set(rules.map(r => r.projectName));
    const uniquePolicies = new Set(rules.map(r => r.policyName));

    const policyAdaptiveMap = new Map<string, boolean>();
    rules.forEach(r => {
        const existing = policyAdaptiveMap.get(r.policyName);
        if (existing === undefined || r.adaptiveProtection) {
            policyAdaptiveMap.set(r.policyName, r.adaptiveProtection);
        }
    });

    const policiesWithAdaptive = Array.from(policyAdaptiveMap.values()).filter(v => v).length;

    const wafCoverage = uniquePolicies.size > 0
        ? Math.round((policiesWithAdaptive / uniquePolicies.size) * 100)
        : 0;

    const criticalRules = rules.filter(r =>
        r.priority < 1000 && r.priority !== 2147483647
    ).length;

    return {
        totalProjects: uniqueProjects.size,
        totalPolicies: uniquePolicies.size,
        wafCoverage,
        criticalRules,
        totalRules: rules.length,
    };
}

// Get project-wise analysis
export function getProjectAnalysis(rules: CloudArmorRule[]): ProjectAnalysis[] {
    const projectMap = new Map<string, {
        policies: Set<string>;
        rules: CloudArmorRule[];
        adaptiveCount: number;
        denyCount: number;
        allowCount: number;
        throttleCount: number;
    }>();

    rules.forEach(rule => {
        if (!projectMap.has(rule.projectName)) {
            projectMap.set(rule.projectName, {
                policies: new Set(),
                rules: [],
                adaptiveCount: 0,
                denyCount: 0,
                allowCount: 0,
                throttleCount: 0,
            });
        }

        const project = projectMap.get(rule.projectName)!;
        project.policies.add(rule.policyName);
        project.rules.push(rule);

        const action = rule.status.toLowerCase();
        if (action.includes('deny')) project.denyCount++;
        else if (action.includes('allow')) project.allowCount++;
        else if (action.includes('throttle')) project.throttleCount++;
    });

    rules.forEach(rule => {
        if (rule.adaptiveProtection) {
            const project = projectMap.get(rule.projectName)!;
            project.adaptiveCount = Array.from(project.policies).filter(policyName => {
                return rules.some(r => r.policyName === policyName && r.adaptiveProtection);
            }).length;
        }
    });

    return Array.from(projectMap.entries())
        .map(([name, data]) => ({
            name,
            policyCount: data.policies.size,
            ruleCount: data.rules.length,
            adaptiveProtectionCount: data.adaptiveCount,
            denyRules: data.denyCount,
            allowRules: data.allowCount,
            throttleRules: data.throttleCount,
            policies: Array.from(data.policies),
            rules: data.rules,
        }))
        .sort((a, b) => b.policyCount - a.policyCount);
}

// Categorize attack vector
export function categorizeAttackVector(matchExpression: string, ruleDescription: string): AttackCategory {
    const expr = matchExpression.toLowerCase();
    const desc = ruleDescription.toLowerCase();

    if (expr.includes('sqli') || desc.includes('sql injection') || desc.includes('sql')) return 'SQLi';
    if (expr.includes('xss') || desc.includes('cross-site scripting') || desc.includes('xss')) return 'XSS';
    if (expr.includes('lfi') || desc.includes('local file inclusion')) return 'LFI';
    if (expr.includes('rfi') || desc.includes('remote file inclusion')) return 'RFI';
    if (expr.includes('rce') || desc.includes('remote code execution') || desc.includes('command injection')) return 'RCE';
    if (expr.includes('php') || expr.includes('nodejs') || desc.includes('php') || desc.includes('node')) return 'PHP/Node.js';
    if (expr.includes('protocol') || expr.includes('http') || desc.includes('protocol')) return 'Protocol Attack';
    if (expr.includes('scanner') || desc.includes('scanner') || expr.includes('scannerdetection')) return 'Scanners';
    if (expr.includes('session') || desc.includes('session fixation')) return 'Session Fixation';
    if (expr.includes('java') || desc.includes('java')) return 'Java';
    if (expr.includes('contains') || expr.includes('region_code') || desc.includes('rate limit') || desc.includes('throttle')) return 'Rate Limiting';
    if (expr.includes('src_ips') || expr.includes('addressgroup') || expr.includes('iplist') || expr.includes('threatintelligence')) return 'IP Lists';
    if (expr.includes('method') || desc.includes('method enforcement')) return 'Method Enforcement';
    if (desc.includes('default')) return 'Default Rule';

    return 'Other';
}

// Get attack vector distribution
export function getAttackVectorDistribution(rules: CloudArmorRule[]): AttackVectorData[] {
    const categoryColors: Record<AttackCategory, string> = {
        'SQLi': '#ef4444',
        'XSS': '#f97316',
        'LFI': '#eab308',
        'RFI': '#84cc16',
        'RCE': '#dc2626',
        'PHP/Node.js': '#8b5cf6',
        'Protocol Attack': '#06b6d4',
        'Scanners': '#ec4899',
        'Session Fixation': '#14b8a6',
        'Java': '#a855f7',
        'Rate Limiting': '#f59e0b',
        'IP Lists': '#3b82f6',
        'Method Enforcement': '#6366f1',
        'Default Rule': '#9ca3af',
        'Other': '#6b7280',
    };

    const distribution = new Map<AttackCategory, number>();

    rules.forEach(rule => {
        const category = categorizeAttackVector(rule.matchExpression, rule.ruleDescription);
        distribution.set(category, (distribution.get(category) || 0) + 1);
    });

    return Array.from(distribution.entries())
        .map(([label, count]) => ({
            label,
            count,
            color: categoryColors[label] || '#6b7280',
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);
}

// Get action distribution
export function getActionDistribution(rules: CloudArmorRule[]): ActionDistributionData[] {
    const actionColors: Record<string, string> = {
        'deny(403)': '#ef4444',
        'deny(404)': '#dc2626',
        'deny(502)': '#b91c1c',
        'allow': '#22c55e',
        'throttle': '#f59e0b',
        'rate_based_ban': '#f97316',
        'redirect': '#3b82f6',
        'other': '#6b7280',
    };

    const distribution = new Map<string, number>();

    rules.forEach(rule => {
        let action = rule.status.toLowerCase().trim();

        if (action.includes('deny')) {
            if (action.includes('403')) action = 'deny(403)';
            else if (action.includes('404')) action = 'deny(404)';
            else if (action.includes('502')) action = 'deny(502)';
            else action = 'deny(403)';
        } else if (action.includes('allow')) {
            action = 'allow';
        } else if (action.includes('throttle')) {
            action = 'throttle';
        } else if (action.includes('redirect')) {
            action = 'redirect';
        } else if (action.includes('rate')) {
            action = 'rate_based_ban';
        } else if (action) {
            action = 'other';
        } else {
            return;
        }

        distribution.set(action, (distribution.get(action) || 0) + 1);
    });

    return Array.from(distribution.entries())
        .map(([action, count]) => ({
            action,
            count,
            color: actionColors[action] || '#6b7280',
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);
}

// Get top projects by policy count
export function getTopProjectsByPolicyCount(rules: CloudArmorRule[], limit: number = 10): ProjectPolicyCount[] {
    const projectPolicies = new Map<string, Set<string>>();

    rules.forEach(rule => {
        if (!projectPolicies.has(rule.projectName)) {
            projectPolicies.set(rule.projectName, new Set());
        }
        projectPolicies.get(rule.projectName)!.add(rule.policyName);
    });

    return Array.from(projectPolicies.entries())
        .map(([project, policies]) => ({
            project,
            policyCount: policies.size,
        }))
        .sort((a, b) => b.policyCount - a.policyCount)
        .slice(0, limit);
}

// Filter by selected projects
export function filterByProjects(rules: CloudArmorRule[], projects: Set<string>): CloudArmorRule[] {
    if (projects.size === 0) return rules;
    return rules.filter(rule => projects.has(rule.projectName));
}

// Filter by selected actions
export function filterByActions(rules: CloudArmorRule[], actions: Set<string>): CloudArmorRule[] {
    if (actions.size === 0) return rules;
    return rules.filter(rule => {
        const status = rule.status.toLowerCase();
        return (
            (actions.has('deny') && status.includes('deny')) ||
            (actions.has('allow') && status.includes('allow')) ||
            (actions.has('throttle') && status.includes('throttle')) ||
            (actions.has('other') && !status.includes('deny') && !status.includes('allow') && !status.includes('throttle'))
        );
    });
}

// Filter by adaptive protection
export function filterByAdaptive(rules: CloudArmorRule[], filter: 'all' | 'enabled' | 'disabled'): CloudArmorRule[] {
    if (filter === 'all') return rules;
    return rules.filter(rule =>
        filter === 'enabled' ? rule.adaptiveProtection : !rule.adaptiveProtection
    );
}

// Paginate rules
export function paginateRules(rules: CloudArmorRule[], page: number, pageSize: number = 25): {
    data: CloudArmorRule[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
} {
    const totalItems = rules.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const data = rules.slice(startIndex, startIndex + pageSize);

    return { data, totalPages, currentPage, totalItems };
}
