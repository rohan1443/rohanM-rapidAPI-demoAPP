const express = require('express')
    , uri = require('lil-uri')
    , _ = require('lodash')

var handlePromise = require('../utilities/handlePromise')
var getPerSessionPollingData = require('../utilities/getSessionPollingPromise')
const { RAPIDAPI_KEY, RAPIDAPI_HOST, API_BASE_URL, CONTENT_TYPE } = require('../constants')

module.exports = (formData) => {
  let options = {
    method: 'POST',
    url: `${API_BASE_URL}/pricing/v1.0`,
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY,
      'content-type': CONTENT_TYPE
    },
    form: formData
  };

  const requestPromise = handlePromise(options, (response, body) => {
    const headerLocation = response.headers.location
      , pathArray = uri(headerLocation).path().split('/')
    return sessionId = pathArray[pathArray.length - 1]
  })
    , getSessionDataPromise = async () => {
      let res = await requestPromise
      return res
    }

  return getSessionDataPromise()
    .then(sessionId => {
      let options = {
        method: 'GET',
        url: `${API_BASE_URL}/pricing/uk2/v1.0/${sessionId}`,
        qs: { pageIndex: '0', pageSize: '10' },
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        json: true
      };

      const handlePollingPromise = handlePromise(options, (response, body) => body)
        , bestPricePerSessionPromise = async () => {
          const res = await handlePollingPromise
          const mapPricingOptions = res.Itineraries.map(itenerary => {
              return itenerary.PricingOptions.map(price => price.Price)
            })
            , sortedPrice = _.sortBy(_.flatten(mapPricingOptions))
          return sortedPrice[0]
        }
      return bestPricePerSessionPromise()
    })
    .catch(error => {
      throw new Error('Something went wrong', error)
    })
}