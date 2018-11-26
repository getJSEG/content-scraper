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
const allShirtsInformationArray = [];

//call back function for a website Request
const request = (websiteUrl, selectEl) => {
     const options = {
         url:websiteUrl,
         transform: (body) => {
            return cheerio.load(body);
        }
     }
    return requestP(options).then(selectEl).catch((error) => {         
         errorLog(error.message);        
        console.log('There’s been a 404 error. Cannot connect to http://shirts4mike.com.')
     });
}
//redirecting from the ex. (http://www.shirts4mike.com/shirt.php) 
//To Shirst Links ex. (http://www.shirts4mike.com/shirt.php?id=101) and extracting the data needed
const shirtsInformation = () => {
    
    for(let shirstInfo of allShirts){
        request(`${url}/${shirstInfo}`, ($) => {
            //store the information for each shirt in an object
            allShirtsInformationArray.push({
                'title': $('.shirt-details').find('h1').text().replace(/[^a-zA-Z\s!?]+/g, '' ),
                'price':$('.shirt-details').find('.price').text(),
                'imageUrl' : `${url}/${$('.shirt-picture').find('img').attr('src')}`,
                'url':`${url}/${shirstInfo}`,
                'time':`${date.getFullYear()}-${date.getDate()}-${date.getMonth()+1} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
            });
            createCSVFile(allShirtsInformationArray);
        })
    } 
}

//create a folder named data in the current directory with a csv File, if there isn't one already. else just create the csv File in the data folder and averride the existing data
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
    const fields = JSON.stringify(['title', 'price', 'imageUrl', 'url', 'Time']);
    
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
const scraper = () => {
    request(`${url}/shirts.php`, ($)=> {
        $('ul.products li').each((index, el) =>{
            allShirts.push($(el).find('a').attr('href'));  
        });
    }).then(shirtsInformation);
}

scraper();