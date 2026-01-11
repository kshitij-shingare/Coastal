"use strict";
// Report type definitions - shared between frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReport = validateReport;
exports.isValidHazardType = isValidHazardType;
exports.isValidSeverityLevel = isValidSeverityLevel;
exports.isValidSourceType = isValidSourceType;
exports.isValidReportStatus = isValidReportStatus;
// Validation functions
function validateReport(report) {
    const errors = [];
    if (!report.location) {
        errors.push('Location is required');
    }
    else {
        if (typeof report.location.latitude !== 'number' ||
            report.location.latitude < -90 || report.location.latitude > 90) {
            errors.push('Valid latitude is required (-90 to 90)');
        }
        if (typeof report.location.longitude !== 'number' ||
            report.location.longitude < -180 || report.location.longitude > 180) {
            errors.push('Valid longitude is required (-180 to 180)');
        }
    }
    if (!report.content?.originalText || report.content.originalText.trim().length === 0) {
        errors.push('Description text is required');
    }
    if (report.source && !['citizen', 'social', 'official'].includes(report.source)) {
        errors.push('Valid source type is required (citizen, social, official)');
    }
    if (report.classification?.confidence !== undefined) {
        if (typeof report.classification.confidence !== 'number' ||
            report.classification.confidence < 0 || report.classification.confidence > 100) {
            errors.push('Confidence score must be between 0 and 100');
        }
    }
    return errors;
}
function isValidHazardType(type) {
    return ['flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'].includes(type);
}
function isValidSeverityLevel(level) {
    return ['low', 'moderate', 'high'].includes(level);
}
function isValidSourceType(source) {
    return ['citizen', 'social', 'official'].includes(source);
}
function isValidReportStatus(status) {
    return ['pending', 'verified', 'rejected'].includes(status);
}
//# sourceMappingURL=report.js.map