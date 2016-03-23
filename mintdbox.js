// define some variables

var apiRoot = 'https://mintdbox.com',
    subscriptionsEndPoint = '/v1/store/api/subscriptions/',
    subscriptionsUrl = apiRoot + subscriptionsEndPoint,
    subscriptions = {},
    subscriptionsCounter = 0,
    subscriptionsTotal = 0,
    newLine = '\n',
    subscriptionPropertiesMap = 
    { 
      'customer': 'customer.name',
      'email': 'customer.email', 
    },
    csv = Object.keys(subscriptionPropertiesMap).join()

// define some functions...

function getNextSubscriptionsBatch(url)
{
  console.log('get subscriptions ' + url)
  $.get(url, function(data)
  {
    // console.log('\t success ', data)
    subscriptionsTotal = data.count

    // populate subscriptions
    if (data.results && data.results.length > 0)
    {
      data.results.forEach(function (result)
      {
        subscriptions[result.id] = result
      })
    } 

    // if there's more, load more
    if (data.next) 
    {
      var nextUrl = url + data.next
      getNextSubscriptionsBatch(nextUrl)
    } 
    else gotAllSubscriptions()
  })
} 

function gotAllSubscriptions()
{
  getSubscriptionsMetadata()
}

function getSubscriptionsMetadata()
{
  // loop through all subscriptions
  for (id in subscriptions) 
  {
    var subscription = subscriptions[id],
        url = apiRoot + subscription.url + 'metadata/'

    // get the subscription metadata
    console.log('get subscription metadata ' + url)
    $.get(url)
    .done(function(metadata)
    { 
      console.log(metadata.data) 
      var subscription = subscriptions[metadata.subscription_id]
      // add each metadata property to the subscription object
      for (property in metadata.data)
      {
        subscription[property] = metadata.data[property]
      }
    })
    .fail(function(error) 
    {
      console.error(error)
    })
    .always(function() 
    {
      subscriptionsCounter ++
      if (subscriptionsCounter >= subscriptionsTotal)
      {
        // console.log('done, now make the CSV!')
        gotAllMetadata()
      } 
    })
  }
}

function gotAllMetadata()
{
  makeCSV()
}

function makeCSV()
{
  console.log('makeCSV')
  // loop through all subscriptions
  for (id in subscriptions) 
  {
    var subscription = subscriptions[id]
    csv += newLine + makeSubscriptionCSV(subscription)
  } 
  console.log(csv)
}

function makeSubscriptionCSV(subscription)
{
  var subscriptionString = '',
      csvProperties = Object.keys(subscriptionPropertiesMap)

  csvProperties.forEach(function(property)
  {
    var path = subscriptionPropertiesMap[property],
        value = getPropertyByPath(subscription, path)
    subscriptionString += value + ','
  })

  return subscriptionString
}

// adapted from from http://stackoverflow.com/a/24221895/2928562
// path is a string representing the pah to the property we're looking for, in dot notation, eg: 'customer.name'
function getPropertyByPath(object, path)
{
  // split the path into components
  path = path.split('.')  
  // clone the object
  var clone = object
  // loop through the path, until we get something
  while(path.length > 0) 
  {
    if (typeof clone !== 'object') return undefined
    clone = clone[path.shift()]
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
  }
  return clone
}

// ...and start it!
getNextSubscriptionsBatch(subscriptionsUrl) 



  /*
    customer
    email 
    birthday
    skinTone
      Fair
      Light
      Medium
      Olive
      Deep
      Dark
    skinConcerns
      Normal
      Combination
      Dry
      Blemished
    skinCondition
      Sensitive
      Acne
      DarkSpots
      Dryness
      EnlargedPores
      Redness
    hairType
      Curly
      Straight
      Fine
      Thick
      Coarse
    hairCondition
      Coloured
      Dry
      Oily
      Relaxed
      Permed
  */