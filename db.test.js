// const db = require("./db.js");

// // const connect = db.createDBConnection();
// // const sql = "Select * from pictures";
// // connect.query(sql, (err, result)=> {
// //     if (err) { return err; }
// //     console.log(result);
// // })

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
// async function testGPSToAddess (data) {
//     var result = await db.GPStoAddress(data.latitude, data.longitude);
//     console.log(result);
// }


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

describe('TEST', () => {
    const a = 1, b = 2;

    test('a+b는 3인가?', () =>{
        expect(a + b).toEqual(3);
    });
    test('a+b는 2인가?', () =>{
        expect(a + b).toEqual(2);
    });
});