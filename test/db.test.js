const axios = require('axios');
const db = require("../db.js");

jest.mock('axios');
jest.mock('./db', () => ({
  getValidToken: jest.fn(),
  reverseGeocoding: jest.fn()
}));

describe('reverseGeocoding', () => {
  const mockLatitude = 1.3521;
  const mockLongitude = 103.8198;
  const mockURL = `https://www.onemap.gov.sg/api/public/revgeocode?location=${mockLatitude},${mockLongitude}&buffer=100&addressType=All&otherFeatures=N`;
  const mockConnection = {
    query: jest.fn() 
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return postal code when API response is successful', async () => {
    axios.get.mockResolvedValue({
      data: { GeocodeInfo: [{ POSTALCODE: '123456' }] }
    });
    const mockToken = {
      access_token: 'mockAccessToken',
      expire_date: Math.floor(Date.now() / 1000) + 1000,
    };
    db.getValidToken.mockResolvedValue(mockToken);

    const postalCode = await db.reverseGeocoding(mockConnection, mockLatitude, mockLongitude);
    expect(postalCode).toBe('123456');
    expect(axios.get).toHaveBeenCalledWith(mockURL, expect.any(Object));
  });
});