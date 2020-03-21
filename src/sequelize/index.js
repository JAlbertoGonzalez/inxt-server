const { Sequelize, Op } = require("sequelize");
require('sequelize-hierarchy')(Sequelize)
const Models = require('./models/index')

const config = require('../services/configService')["sql-server"]
const Logger = console


function CreateInstance() {

  const instance = new Sequelize(
    config.dbName,
    config.user,
    config.password,
    {
      host: config.host,
      dialect: 'mysql',
      operatorsAliases: 0,
      logging: Logger.debug,
      define: { underscored: false }
    }
  )

  return instance;
}

function GetConnectedDatabaseInstance() {

  return new Promise((resolve, reject) => {
    const instance = CreateInstance();

    instance.authenticate().then(() => {
      Models(instance);
      console.log('Loaded models');
      resolve(instance)
    }).catch(err => {
      reject(err)
    });

  });

}


module.exports = {
  GetConnectedDatabaseInstance
}
