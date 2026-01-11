"use strict";
/**
 * Processing Module Index
 *
 * Exports AI processing services for hazard classification and language analysis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageProcessingService = exports.translateHazardType = exports.analyzeText = exports.determineUrgency = exports.extractKeywords = exports.detectLanguage = exports.hazardClassificationService = exports.generateReportSummary = exports.classifyReportsBatch = exports.classifyHazard = void 0;
var hazard_classification_1 = require("./hazard-classification");
Object.defineProperty(exports, "classifyHazard", { enumerable: true, get: function () { return hazard_classification_1.classifyHazard; } });
Object.defineProperty(exports, "classifyReportsBatch", { enumerable: true, get: function () { return hazard_classification_1.classifyReportsBatch; } });
Object.defineProperty(exports, "generateReportSummary", { enumerable: true, get: function () { return hazard_classification_1.generateReportSummary; } });
Object.defineProperty(exports, "hazardClassificationService", { enumerable: true, get: function () { return hazard_classification_1.hazardClassificationService; } });
var language_processing_1 = require("./language-processing");
Object.defineProperty(exports, "detectLanguage", { enumerable: true, get: function () { return language_processing_1.detectLanguage; } });
Object.defineProperty(exports, "extractKeywords", { enumerable: true, get: function () { return language_processing_1.extractKeywords; } });
Object.defineProperty(exports, "determineUrgency", { enumerable: true, get: function () { return language_processing_1.determineUrgency; } });
Object.defineProperty(exports, "analyzeText", { enumerable: true, get: function () { return language_processing_1.analyzeText; } });
Object.defineProperty(exports, "translateHazardType", { enumerable: true, get: function () { return language_processing_1.translateHazardType; } });
Object.defineProperty(exports, "languageProcessingService", { enumerable: true, get: function () { return language_processing_1.languageProcessingService; } });
//# sourceMappingURL=index.js.map