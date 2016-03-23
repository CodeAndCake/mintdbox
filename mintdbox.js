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
    subscriptionString += resolve(subscription, subscriptionPropertiesMap[property]) + ','
  })

  return subscriptionString
}

// from http://stackoverflow.com/a/24221895/2928562
function resolve(object, path)
{
  path = path.split('.').reverse()  
  var current = object
  while(path.length) 
  {
    if (typeof current !== 'object') return undefined
    current = current[path.pop()]
  }
  return current
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