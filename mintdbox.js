// define some variables

var subscriptionPropertiesMap = 
    {
      // spreadsheet        : subscription data object 
      'customer'            : 'customer.name',
      'email'               : 'customer.email', 
      'birthday'            : 'cart.birthday',

      'fair skin'           : 'skinTone.Fair',
      'light skin'          : 'skinTone.Light',
      'medium skin'         : 'skinTone.Medium',
      'olive skin'          : 'skinTone.Olive',
      'deep skin'           : 'skinTone.Deep',
      'dark skin'           : 'skinTone.Dark',

      'normal skin'         : 'skinConcerns.Normal',
      'combination skin'    : 'skinConcerns.Combination',
      'dry skin'            : 'skinConcerns.Dry',
      'oily skin'           : 'skinConcerns.Oily',
      'blemished skin'      : 'skinConcerns.Blemished',

      'sensitive skin'      : 'skinCondition.Sensitive',
      'acne'                : 'skinCondition.Acne',
      'dark spots'          : 'skinCondition.DarkSpots',
      'dehydrated skin'     : 'skinCondition.Dryness',
      'enlarged pores'      : 'skinCondition.EnlargedPores',
      
      'curly hair'          : 'hairType.Curly',
      'straight hair'       : 'hairType.Straight',
      'fine hair'           : 'hairType.Fine',
      'thick hair'          : 'hairType.Thick',
      'coarse hair'         : 'hairType.Coarse',

      'coloured hair'       : 'hairCondition.Coloured',
      'dry hair'            : 'hairCondition.Dry',
      'oily hair'           : 'hairCondition.Oily',
      'relaxed hair'        : 'hairCondition.Relaxed',
      'permed hair'         : 'hairCondition.Permed',

      '0-£50'               : 'spend.0-50',
      '£50-£100'            : 'spend.50-100',
      '£100-£150'           : 'spend.100-150',
      '£150- £200'          : 'spend.150-200',
      '£200+'               : 'spend.200plus',

      'skincare'            : 'productsInterestedIn.Skincare',
      'bath & body'         : 'productsInterestedIn.BathBody',
      'make up'             : 'productsInterestedIn.Makeup',
      'haircare'            : 'productsInterestedIn.Haircare',
      'nails'               : 'productsInterestedIn.Nails',
      'tools & accessories' : 'productsInterestedIn.ToolsAccessories'
    },
    // csv = Object.keys(subscriptionPropertiesMap).join(),
    csv = '', 
    apiRoot = 'https://mintdbox.com',
    subscriptionsEndPoint = '/v1/store/api/subscriptions/',
    subscriptionsUrl = apiRoot + subscriptionsEndPoint,
    subscriptions = {},
    subscriptionsCounter = 0,
    subscriptionsTotal = 0,
    newLine = '\n',
    blob, downloadUrl

// define some functions...

function getNextSubscriptionsBatch(url)
{
  if (subscriptionsTotal == 0) console.log('Getting subscriptions... ')
  else logCurrentProgress()  
  $.get(url)
  .done(function(data)
  { 
    // console.log('\t success ', data)
    subscriptionsTotal = data.count

    // populate subscriptions
    if (data.results && data.results.length > 0)
    {
      data.results.forEach(function (result)
      {
        subscriptionsCounter ++
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
  .fail(function(error) 
  {
    console.error(error)
  })
} 

function gotAllSubscriptions()
{
  logCurrentProgress() 
  console.log('Got all subscriptions!')
  subscriptionsCounter = 0 // reset
  getSubscriptionsMetadata()
}

function getSubscriptionsMetadata()
{
  console.log('Getting surveys data for each subscription...')
  // loop through all subscriptions
  for (id in subscriptions) 
  {
    var subscription = subscriptions[id],
        url = apiRoot + subscription.url + 'metadata/'

    // get the subscription metadata
    // console.log('get subscription metadata ' + url)
    $.get(url)
    .done(function(metadata)
    { 
      // console.log(metadata.data) 
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
      logCurrentProgress()
      if (subscriptionsCounter >= subscriptionsTotal) gotAllMetadata()
    })
  }
}

function gotAllMetadata()
{
  console.log('Got all surveys!')
  makeCSV()
}

function makeCSV()
{
  console.log('Building CSV...')
  // loop through all subscriptions
  for (id in subscriptions) 
  {
    var subscription = subscriptions[id]
    csv += makeSubscriptionCSV(subscription) + newLine
  } 
  console.log(csv)

  // make a blob, fill it with csv stuff, then download it as a file
  blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
  downloadUrl = URL.createObjectURL(blob)
  location.replace(downloadUrl)
}

function makeSubscriptionCSV(subscription)
{
  var subscriptionString = '',
      csvProperties = Object.keys(subscriptionPropertiesMap)

  csvProperties.forEach(function(property)
  {
    var path = subscriptionPropertiesMap[property],
        value = getPropertyByPath(subscription, path)

    if (value == undefined) value = ''
    if (value == 'on') value = 'yes'
    value = value.trim() // trim white space at the beginning and end
    subscriptionString += value + ','
  })

  return subscriptionString
}

function logCurrentProgress()
{
  console.log('\t ' + subscriptionsCounter + '/' + subscriptionsTotal) 
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