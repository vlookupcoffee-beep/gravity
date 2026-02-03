/**
 * Standardized PoW Tasks for ID-NET Gravity
 */
export const STANDARD_POW_TASKS = [
    { name: "01.KICK OFF", order: 1 },
    { name: "02.SURVEY / AANWIJZHING LAPANGAN", order: 2 },
    { name: "03.DESIGN REVIEW MEETING", order: 3 },
    { name: "04.PERIJINAN", order: 4 },
    { name: "05.DELIVERY MATERIAL", order: 5 },
    { name: "06.PENARIKAN KABEL & TANAM TIANG", order: 6 },
    { name: "07.INSTALASI ODP", order: 7 },
    { name: "08.DONE INSTALASI", order: 8 },
    { name: "09.SUBMIT ABD V4", order: 9 },
    { name: "10.ATP", order: 10 }
];

/**
 * Mapping of PoW Tasks to Material Names for automatic progress calculation.
 * Uses keywords to find matching tasks in the project's PoW.
 */
export const TASK_MATERIAL_KW_MAPPING = {
    "TIANG": [ // Task name contains "TIANG" or "POLE"
        "NP-7.0-140-2S",
        "NP-7.0-140-3S",
        "NP-9.0-200-2S",
        "NP-9.0-200-3S"
    ],
    "KABEL": [ // Task name contains "KABEL" or "PENARIKAN" or "CABLE"
        "AC-ADSS-SM-12C",
        "AC-ADSS-SM-24C",
        "AC-ADSS-SM-48C",
        "KABEL ADSS 12 CORE",
        "KABEL ADSS 24 CORE",
        "KABEL ADSS 48 CORE"
    ],
    "ODP": [ // Task name contains "ODP" or "FAT" or "JC"
        "FAT-PB-16C-SOLID",
        "PS-1-16-FAT",
        "JC-OF-SM-48C",
        "ODP",
        "FAT",
        "CLOSURE"
    ]
};

/**
 * Standard Project Status Options
 */
export const PROJECT_STATUS_OPTIONS = [
    "KICK OFF",
    "SURVEY / AANWIJZHING LAPANGAN",
    "DESIGN REVIEW MEETING",
    "PERIJINAN",
    "DELIVERY MATERIAL",
    "PENARIKAN KABEL & TANAM TIANG",
    "INSTALASI ODP",
    "DONE INSTALASI",
    "SUBMIT ABD V4",
    "ATP"
];

/**
 * Weighted Status Mapping for Overall Progress Calculation
 */
export const STATUS_WEIGHT_MAPPING = [
    {
        name: "DD-BRNG-HDPE",
        weight: 30,
        identifiers: ["DD-BRNG-HDPE-40-1"]
    },
    {
        name: "HDPE",
        weight: 10,
        identifiers: ["HDPE-40-33"]
    },
    {
        name: "KABEL",
        weight: 15,
        identifiers: ["AC-ADSS-SM-96C", "AC-ADSS-SM-12C", "AC-ADSS-SM-24C", "AC-ADSS-SM-48C", "AC-ADSS-SM-144C"]
    },
    {
        name: "ACCESSORIES",
        weight: 10,
        identifiers: ["FS-OF-SM", "CO-OF-SM"]
    },
    {
        name: "PIT_MH",
        weight: 10,
        identifiers: ["MH-PIT-120", "MH-PIT-80"]
    },
    {
        name: "TIANG",
        weight: 15,
        identifiers: ["NP-7.0-140-3S", "NP-7.0-140-2S", "NP-9.0-140-3S"]
    }
];
