
const admin = require('../models/admin')
const bcrypt = require('bcrypt');
require('dotenv').config();

const createSuperAdmin = async () => {
    try {
       
        const existingSuperAdmin = await admin.findOne({ 
            $or: [
                { email: 'obscura@admin.com' },
                { role: 'superAdmin' }
            ]
        });
        
        if (existingSuperAdmin) {
            console.log('⚠️ Super Admin already exists. Skipping creation.');
            console.log(`📧 Email: ${existingSuperAdmin.email}`);
            console.log(`🔑 Role: ${existingSuperAdmin.role}`);
            console.log('📦 Full user object:', JSON.stringify(existingSuperAdmin, null, 2));
            console.log('🗂️ All fields:', Object.keys(existingSuperAdmin.toObject()));
            return null;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash('Asdf@123', 10);
        
        // Create super admin user
        const superAdmin = new admin({
            email: 'obscura@admin.com',
            username: 'superAdmin',
            password: hashedPassword,
            role: 'superAdmin',
            isSuperAdmin: true,
            isblocked: false,
            createdAt: new Date()
        });
        
        await superAdmin.save();
        console.log('✅ Super Admin created successfully!');
        console.log('📧 Email: obscura@admin.com');
        console.log('🔑 Password: Asdf@123');
        console.log('👤 Role: superAdmin');
        
        return superAdmin;
    } catch (error) {
        console.error('Error creating super admin:', error);
        return null;
    }
};

module.exports = createSuperAdmin;