const { Organization, User } = require('./src/models');
const { sequelize } = require('./src/models');

async function check() {
  try {
    const orgs = await Organization.findAll();
    const users = await User.findAll({ attributes: ['email', 'organization_id'] });
    console.log('Orgs:', JSON.stringify(orgs, null, 2));
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
