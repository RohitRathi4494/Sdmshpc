
export enum ReportTemplate {
    NURSERY = 'NURSERY',
    LKG_UKG = 'LKG_UKG',
    I_II = 'I_II',
    III_VIII = 'III_VIII',
    IX_XII = 'IX_XII',
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
    const highClasses = ['IX', 'X', 'XI', 'XII'];
    if (highClasses.includes(upperClass)) return ReportTemplate.IX_XII;

    return ReportTemplate.UNKNOWN;
}
