const db = require('../lib/db.js');
const Joi = require('@hapi/joi');
const config = require('../lib/config');

const schema = Joi.object({
  _id: Joi.string().optional(), // generated by nedb
  userId: Joi.string().required(),
  userEmail: Joi.string().required(),
  connectionId: Joi.string().required(),
  connectionName: Joi.string().required(),
  startTime: Joi.date(),
  stopTime: Joi.date(),
  queryRunTime: Joi.number().integer(),
  queryId: Joi.string().allow(''),
  queryName: Joi.string().allow(''),
  queryText: Joi.string().required(),
  rowCount: Joi.number().integer(),
  incomplete: Joi.boolean(),
  createdDate: Joi.date().default(new Date())
});

function findOneById(id) {
  return db.queryHistory.findOne({ _id: id });
}

async function findAll() {
  return db.queryHistory
    .cfind({}, {})
    .sort({ startTime: -1 })
    .exec();
}

function findByFilter(filter) {
  return db.queryHistory
    .cfind(filter || {}, {})
    .sort({ startTime: -1 })
    .limit(config.get('queryHistoryResultMaxRows'))
    .exec();
}

async function removeOldEntries() {
  const days = config.get('queryHistoryRetentionTimeInDays') * 86400 * 1000;
  const retentionPeriodStartTime = new Date(new Date().getTime() - days);

  // Compaction function called separately in every ten minutes
  return db.queryHistory.remove(
    { createdDate: { $lt: retentionPeriodStartTime } },
    { multi: true }
  );
}
/**
 * Save queryHistory object
 * returns saved queryHistory object
 * @param {object} queryHistory
 */
async function save(data) {
  const joiResult = schema.validate(data);
  if (joiResult.error) {
    return Promise.reject(joiResult.error);
  }
  return db.queryHistory.insert(joiResult.value);
}

module.exports = {
  findOneById,
  findAll,
  findByFilter,
  removeOldEntries,
  save
};
