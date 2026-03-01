export type TajwidRule = {
    title: string;
    description: string;
    letters?: string;
    examples: string;
};

export type TajwidCategory = {
    category: string;
    rules: TajwidRule[];
};

export const tajwidData: TajwidCategory[] = [
    {
        category: "Hukum Nun Sukun dan Tanwin",
        rules: [
            {
                title: "Idzhar Halqi",
                description:
                    "Dibaca jelas tanpa dengung atau samar saat Nun Sukun/Tanwin bertemu huruf Izhar.",
                letters: "أ ه ح خ ع غ",
                examples: "مِنْ اٰيٰتِنَا - مِنْهُمْ - يَوْمًا اَوْ",
            },
            {
                title: "Idgham Bighunnah",
                description:
                    "Dimasukkan ke huruf berikutnya dan didengungkan (panjang) saat bertemu di dua kata berbeda.",
                letters: "ي ن م و",
                examples: "مَنْ يَّقُوْلُ - بِسُوْرَةٍ مِّنْ - فِرَاشاً وَالسَّمَاء",
            },
            {
                title: "Idzhar Mutlak",
                description:
                    "Dibaca jelas jika Nun Sukun bertemu huruf Ya atau Wau dalam satu kata (hanya ada 4 kata di Al-Quran).",
                examples: "قنوان – صنوان – بنيان - الدنيا",
            },
            {
                title: "Idgham Bilaghunnah",
                description: "Dimasukkan ke huruf berikutnya tanpa didengungkan.",
                letters: "ل ر",
                examples: "فَمَنْ رَبُكُمَا - مِنْ لَدُ - مِنْ رَبٍ رَحِيْمٍ",
            },
            {
                title: "Iqlab",
                description:
                    "Diubah bunyinya menjadi 'Mim' dan didengungkan (panjang) jika bertemu huruf Ba.",
                letters: "ب",
                examples: "سَمِيْعٌ بَصِيْرٌ - تَنْبِيْهٌ - مِنْ بَعْدِ",
            },
            {
                title: "Ikhfa Haqiqi",
                description:
                    "Disamarkan bunyinya dengan dengung yang dipanjangkan.",
                letters: "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
                examples: "وَالْإِنْجِيلَ - أَنْزَلَ - ذُو انْتِقَامٍ",
            },
        ],
    },
    {
        category: "Hukum Mim Sukun",
        rules: [
            {
                title: "Ikhfa' Syafawi",
                description: "Didengungkan memanjang jika Mim Sukun bertemu huruf Ba.",
                letters: "ب",
                examples: "تَرْمِيْهِمْ بِحِجَارَةٍ - يَعْلَمْ بِاَنَّ",
            },
            {
                title: "Idgham Mimi",
                description:
                    "Mim pertama dimasukkan ke Mim kedua disertai dengung panjang.",
                letters: "م",
                examples: "فِيْ قُلُوْبِهِمْ مَرَضٌ - اَجْرَهُمْ مَرَّتَيْنِ",
            },
            {
                title: "Idzhar Syafawi",
                description: "Dibaca jelas jika bertemu huruf selain Ba dan Mim.",
                examples: "اَلَمْ تَرَ – كَيْدَهُمْ فِيْ",
            },
        ],
    },
    {
        category: "Hukum Idgham (Pertemuan 2 Huruf)",
        rules: [
            {
                title: "Idgham Mutamatsilain",
                description:
                    "Dua huruf yang sama (makhraj & sifat), sukun bertemu hidup. Huruf pertama dimasukkan tanpa dengung (kecuali Mim & Mim, Nun & Nun).",
                examples: "إِذ ذَّهَبَ - وَقَدْ دَّخَلُوْا",
            },
            {
                title: "Idgham Mutajanisain",
                description:
                    "Dua huruf makhraj sama tapi sifat beda. Dimasukkan tanpa dengung.",
                letters: "(ط د ت) (ظ ذ ث) (م ب)",
                examples: "وَدَّت طَّـآئِفَةٌ - يَلْهَث ذَّلِكَ - ارْكَبْ مَّعَنَا",
            },
            {
                title: "Idgham Mutaqaribain",
                description:
                    "Dua huruf berdekatan makhraj/sifatnya. Dimasukkan tanpa dengung.",
                letters: "(ق :ك) (ل : ر)",
                examples: "اَلَمْ نَخْلُقْكُّمْ - وَقُـل رَّبِّ",
            },
        ],
    },
    {
        category: "Hukum Mad (Panjang)",
        rules: [
            {
                title: "Mad Asli / Mad Thabi’i",
                description:
                    "Fathah bertemu Alif, Kasrah bertemu Ya Sukun, atau Dhammah bertemu Wau Sukun. Dibaca panjang 2 harakat.",
                letters: "ا , و , ي",
                examples: "كتَا بٌ - يَقُوْلُ – سمِيْعٌ",
            },
            {
                title: "Mad 'Iwadh",
                description:
                    "Fathatain bertemu Alif dan diwaqafkan (berhenti). Dibaca 2 harakat. Kecuali ta marbuthah (ة) dibaca Ha sukun.",
                examples: "سَميْعًا بَصيْرًا - عَلِيْمًا حَكِيمًا",
            },
            {
                title: "Mad Shilah Qashirah",
                description:
                    "Ha Dhamir (Kasrah/Dhammah) diapit huruf hidup, sesudahnya bukan Hamzah. Dibaca 2 harakat.",
                examples: "اِنَّهُ كَانَ - ﻻَشَرِيْك لَهُ",
            },
            {
                title: "Mad Wajib Muttashil",
                description:
                    "Mad Thabi'i bertemu Hamzah di SATU kata. Panjang 4 atau 5 harakat.",
                examples: "سَوَآءٌ - جَآءَ – جِيْءَ",
            },
            {
                title: "Mad Ja’iz Munfashil",
                description:
                    "Mad Thabi'i bertemu Hamzah di kata BERBEDA. Panjang 4 atau 5 harakat (boleh 2).",
                examples: "وَﻻَأنْتُمْ - بِمَا أُنْزِلَ",
            },
            {
                title: "Mad Arid Lissukun",
                description:
                    "Mad Thabi'i bertemu huruf hidup yang disukunkan karena waqaf (berhenti di akhir ayat). Panjang 2, 4, atau 6 harakat.",
                examples: "الْعَالَمِيْن۞ – يُؤْمِنُوْن۞ – تَعْمَلُوْن۞",
            },
            {
                title: "Mad Liin",
                description:
                    "Huruf ber-fathah bertemu Ya/Wau Sukun, lalu diwaqafkan di huruf berikutnya. Panjang 2, 4, atau 6 harakat.",
                examples: "رَيْبٌ – خَوْفٌ",
            },
        ],
    },
];
