const request = require('request')

module.exports = (options, cb) => {
  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        return reject(error)
      } else {
        const responseData = cb(response, body)
        return resolve(responseData)
      }
    })
  })
}