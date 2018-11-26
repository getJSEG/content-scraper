"use strict";
const requestP = require("request-promise");
const Json2csvParser = require('json2csv').Parser;
const cheerio = require("cheerio");
const fs = require('fs');
const date = new Date();

const day = ['Sun', 'Mon', 'Tues', 'Web', 'Thur','Fri', 'Sat'];
const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const url = "http://shirts4mike.com";
const allShirts = [];
let allShirtsInformationArray = [];

//call back function fot a website Request
const request = (websiteUrl, selectEl) => {
     const options = {
         url:websiteUrl,
         transform: (body) => {
            return cheerio.load(body);
        }
     }
    return requestP(options).then(selectEl).catch((error) => {         
         errorLog(error.message);
     });
}
//redirecting from the (http://www.shirts4mike.com/shirt.php) to where the shirt information is ex.(http://www.shirts4mike.com/shirt.php?id=101) and gettin all the information needed
const shirtsInformation = () => {
    
    for(let shirstInfo of allShirts){
        request(`${url}/${shirstInfo}`, ($) => {
            //store the information for each shirt in an object
            allShirtsInformationArray.push({
                'shirt':shirstInfo.split('.php?id=').join('-'),
                'image' : `${url}/${$('.shirt-picture').find('img').attr('src')}`,
                'price':$('.shirt-details').find('.price').text() ,
                'url':`${url}/${shirstInfo}`,
                'title': $('.shirt-details').find('h1').text().replace(/[^a-zA-Z\s!?]+/g, '' )
            });
            createCSVFile(allShirtsInformationArray)
        })
    } 
}

//create a folder named data in the current directory with a csv File, if there isn't one already. else just create the csv File in the data folder
const createCSVFile = (ShirtInfo) => {
  if (fs.existsSync(`${process.cwd()}/data`)) {         
      fs.writeFile(`${process.cwd()}/data/${date.getFullYear()}-${date.getDate()}-${date.getMonth()+1}.csv`, parseToCSV(ShirtInfo), 'utf8', (error) => { if(error) throw errorLog(error) });    
  }else{ 
      fs.mkdirSync(`${process.cwd()}/data`); 
      fs.writeFile(`${process.cwd()}/data/${date.getFullYear()}-${date.getDate()}-${date.getMonth()+1}.csv`, parseToCSV(ShirtInfo), 'utf8', (error) => { if(error) throw errorLog(error) }); 
  }
}

//parses the array object to a csv file
const parseToCSV = (dataObject) => {
    const fields = JSON.stringify(['shirt', 'image', 'price', 'url', 'title']);
    
    try {
      const parser = new Json2csvParser(fields);
      const csv = parser.parse(dataObject);
      return csv;
    } catch (error) { errorLog(error) }
}

//Create or append errors to scrapper-error file
const errorLog = (error) => {
    const errorLog = `[${day[date.getDay()]} ${month[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} GMT-${date.getUTCHours()}${date.getUTCMinutes()} (PST)] ${error}\n`;
    
    if(!fs.existsSync(`${process.cwd()}/scraper-error.log`)){
       fs.writeFile(`${process.cwd()}/scraper-error.log`, errorLog, 'utf8', (error) => { if(error) throw err; });
    }else{
       fs.appendFile(`${process.cwd()}/scraper-error.log`, errorLog, 'utf8', (error) => { if(error) throw err; });
    }
}

//request to the link and extract the html
const contentScraper = () => {
    request(`${url}/shirts.php`, ($)=> {
        $('ul.products li').each((index, el) =>{
            allShirts.push($(el).find('a').attr('href'));  
        });
    }).then(shirtsInformation);
}

contentScraper();