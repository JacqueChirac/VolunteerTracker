// shared swim-level options used by volunteer account + organizer admin forms
export type SwimLevel = { value: string; name: string; description: string };

export const swimLevels: SwimLevel[] = [
	{ value: 'Junior 1', name: 'Junior 1', description: 'Learn to Swim group focused on fundamental skills for all four competitive strokes, starts, and turns. 45-min practices twice weekly, Oct–Jun (three 11-week sessions). Typically 1–2 years. Prerequisite: Swim assessment.' },
	{ value: 'Junior 2', name: 'Junior 2', description: 'For swimmers ready to compete regularly. Focus on stroke improvement and Learning to Train—pace clocks, set pacing, racing skills. 3x/week, Sep–Jun. Typically 1–2 years. Prerequisite: Coach recommendation with commitment to competition.' },
	{ value: 'White', name: 'White', description: 'Advanced Learning to Train. Stroke improvement plus intermediate training techniques and advanced racing strategies. 4x/week, 4.5 hrs total, Sep–Jun. Prerequisite: Coach recommendation.' },
	{ value: 'Blue', name: 'Blue', description: 'Advanced stroke mechanics, training, and racing strategies. Learning to Compete focus. 4x/week, 8 hrs total, Sep–Jun. Monthly competitions expected. Prerequisite: Coach recommendation.' },
	{ value: 'Senior', name: 'Senior', description: 'High-level training and competition. Stroke technique, racing strategies, sport psychology. 4x/week, 8 hrs total, Sep–Jun. Designated competitions required. Prerequisite: Coach recommendation.' },
	{ value: 'Senior Elite', name: 'Senior Elite', description: 'Most advanced group—Learning to Excel. All practices and designated meets required. 14 hrs/week, Sep–Jun. Prerequisite: Coach recommendation.' },
	{ value: 'Youth Conditioning', name: 'Youth Conditioning', description: 'For teens pursuing lifeguarding, triathlons, or fitness. 1-hr practices 3x/week, Oct–Jun (three 11-week sessions). Prerequisite: Able to swim 100m non-stop.' },
	{ value: 'Masters', name: 'Masters', description: 'Adults 18+ for fitness, technique, competition, or social swimming. Up to 4x/week, Sep–Jun. Prerequisite: Able to swim 50m.' }
];
