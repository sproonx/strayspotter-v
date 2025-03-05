// const db = require("./db.js");
// const mysql = require('mysql2');

// async function testGPSToAddess (data) {
//     var result = await db.GPSToAddress(data.latitude, data.longitude);
//     console.log(result);
// }
//   const data = {
//     latitude:1.31706,
//     longitude: 103.879
//   }
// testGPSToAddess(data);

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     database: 'strayspotter_database',
//     password: process.env.DB_PASSWORD,
//   });

// const sql = "Select * from pictures";
// connection.query(sql, (err, result)=> {
//     if (err) { return err; }
//     console.log(result);
// })

// async function testInsertDataToDB (param) {
//     var metadata;
//     if (!param){
//         metadata = {
//             longitude : 1,
//             latitude : 2,
//             CreateDate: "2025-03-04T16:00:00.000Z",
//         };
//     } else {
//         metadata = param;
//     }
//     console.log(await db.insertDataToDB(metadata));
// }

// async function testGPSByID (id) {
//     const data = await db.fetchGPSByID(id);
//     console.log(data)
// }

// // TODO : FIX ERROR


// //   createReport
// async function testCreateReport () {
//     var result = await db.createReport("day");
//     console.log(result);
// }

// var currentDate = new Date();
// const metadata = {
//     longitude : 1,
//     latitude : 2,
//     CreateDate: currentDate,
// };
// // testInsertDataToDB(metadata);

// testCreateReport();


// const axios = require('axios');
// const db = require("./db.js");

// jest.mock('axios');

// describe('reverseGeocoding', () => {
//   const mockLatitude = 1.3521;
//   const mockLongitude = 103.8198;
//   const mockURL = `https://www.onemap.gov.sg/api/public/revgeocode?location=${mockLatitude},${mockLongitude}&buffer=100&addressType=All&otherFeatures=N`;

//   afterEach(() => {
//     jest.clearAllMocks(); // 각 테스트 후 Mock 초기화
//   });

//   test('should return postal code when API response is successful', async () => {
//     axios.get.mockResolvedValue({
//       data: { GeocodeInfo: [{ POSTALCODE: '123456' }] }
//     });

//     const postalCode = await db.reverseGeocoding(mockLatitude, mockLongitude);
//     expect(postalCode).toBe('123456');
//     expect(axios.get).toHaveBeenCalledWith(mockURL, expect.any(Object));
//   });

//   test('should return null if latitude or longitude is null', async () => {
//     const postalCode1 = await reverseGeocoding(null, mockLongitude);
//     const postalCode2 = await reverseGeocoding(mockLatitude, null);

//     expect(postalCode1).toBeNull();
//     expect(postalCode2).toBeNull();
//     expect(axios.get).not.toHaveBeenCalled();
//   });

//   test('should return null if API request fails', async () => {
//     axios.get.mockRejectedValue(new Error('Request failed'));

//     const postalCode = await reverseGeocoding(mockLatitude, mockLongitude);
//     expect(postalCode).toBeNull();
//   });

//   test('should return null for API error 400 (invalid location)', async () => {
//     axios.get.mockRejectedValue({ response: { status: 400, data: 'Your provided location is invalid.' } });

//     const postalCode = await reverseGeocoding(mockLatitude, mockLongitude);
//     expect(postalCode).toBeNull();
//   });

//   test('should return null for API error 401 (invalid token)', async () => {
//     axios.get.mockRejectedValue({ response: { status: 401, data: 'Invalid token' } });

//     const postalCode = await reverseGeocoding(mockLatitude, mockLongitude);
//     expect(postalCode).toBeNull();
//   });

//   test('should return null for API error 429 (rate limit exceeded)', async () => {
//     axios.get.mockRejectedValue({ response: { status: 429, data: 'API limit(s) exceeded.' } });

//     const postalCode = await reverseGeocoding(mockLatitude, mockLongitude);
//     expect(postalCode).toBeNull();
//   });
// });