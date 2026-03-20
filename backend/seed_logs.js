
const { Equipment, ReturnConditionLog, User, Request } = require('./models');

async function seed() {
    try {
        console.log('Starting seed...');
        const equipment = await Equipment.findAll();
        const user = await User.findOne({ where: { role: 'admin' } });

        if (!equipment.length || !user) {
            console.error('No equipment or admin user found');
            return;
        }

        for (const item of equipment) {
            const existing = await ReturnConditionLog.findOne({ where: { equipment_id: item.id } });
            if (!existing) {
                await ReturnConditionLog.create({
                    equipment_id: item.id,
                    condition: item.condition || 'good',
                    notes: 'Initial data sync: Status verified.',
                    recorded_at: new Date()
                });
                console.log(`Log created for ${item.name}`);
            }
        }

        console.log('Seeding finished successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
