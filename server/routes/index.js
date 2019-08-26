const express = require('express')
  , router = express.Router()
  , getPollingData = require('../utilities/getSessionPollingPromise')
  , moment = require('moment')
  , cache = require('node-cache')
  , { RAPIDAPI_KEY, RAPIDAPI_HOST } = require('../constants')


/* Creating the caching middleware using in-memory caching */
let nodeCache = new cache()

/* GET home page. */
router.get('/', function (req, res, next) {
  const { startDate, lastDate, country, currency, locale, origin, destination, adults } = req.query
  let key = `${origin}_${destination}`
  const cacheContent = nodeCache.get(key)
  if (cacheContent) {
    res.send(cacheContent);
    return
  }
  else {
    const datesArray = ((sd, ld) => {
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
          nodeCache.set(key, { mappedResult }, 60)
          res.status(200).send({ mappedResult })
        } catch (error) {
          throw new Error(error)
        }
      }
    promiseAll(arrayOfPromises)
  }

});

module.exports = router;
