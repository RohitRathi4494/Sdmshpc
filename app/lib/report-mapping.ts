
export enum ReportTemplate {
    NURSERY = 'NURSERY',
    LKG_UKG = 'LKG_UKG',
    I_II = 'I_II',
    III_VIII = 'III_VIII',
    IX = 'IX',
    X_XII = 'X_XII', // Placeholder for future use
    UNKNOWN = 'UNKNOWN'
}

export function getTemplateForClass(className: string): ReportTemplate {
    if (!className) return ReportTemplate.UNKNOWN;

    const upperClass = className.toUpperCase().trim();

    if (upperClass === 'NUR' || upperClass === 'NURSERY') return ReportTemplate.NURSERY;
    if (upperClass === 'LKG' || upperClass === 'UKG') return ReportTemplate.LKG_UKG;
    if (upperClass === 'I' || upperClass === 'II') return ReportTemplate.I_II;

    // III to VIII
    const middleClasses = ['III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    if (middleClasses.includes(upperClass)) return ReportTemplate.III_VIII;

    // IX to XII
    if (['IX', '9'].includes(upperClass)) {
        return ReportTemplate.IX;
    }

    if (['X', '10', 'XI', '11', 'XII', '12'].includes(upperClass)) {
        return ReportTemplate.X_XII;
    }
    return ReportTemplate.UNKNOWN;
}
