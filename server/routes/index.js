var express = require('express');
var router = express.Router();
var getPollingData = require('../utilities/getSessionPollingPromise')
var moment = require('moment')
const { RAPIDAPI_KEY, RAPIDAPI_HOST } = require('../constants')

/* GET home page. */
router.get('/', function (req, res, next) {
  const { startDate, lastDate, country, currency, locale, origin, destination, adults } = req.query
    , datesArray = ((sd, ld) => {
      let newArray = []
        , sdt = new Date(sd)
        , ldt = new Date(ld)

      while (sdt <= ldt) {
        newArray.push(moment(sdt).format('YYYY-MM-DD'))
        sdt.setDate(sdt.getDate() + 1)
      }
      return newArray
    })(startDate, lastDate)


  const formData = {
      country
    , currency
    , locale
    , adults
    , originPlace: origin
    , destinationPlace: destination
  }

  const arrayOfPromises = datesArray.map(date => {
    const dataObj = Object.assign({}, formData, { outboundDate: date })
    return (() => getPollingData(dataObj))()
  })
    , promiseAll = async (data) => {
      try {
        const result = await Promise.all(data)
          , mappedResult = datesArray.map((date, i) => {
            return {
              date
              , price: result[i]
            }
          })
        res.status(200).send({ mappedResult })
      } catch (error) {
        throw new Error(error)
      }
    }

  promiseAll(arrayOfPromises)
});

module.exports = router;
