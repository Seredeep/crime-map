// Test script for the incidents API with location data
const testIncident = async () => {
  try {
    // First, create an incident with location data
    const formData = new FormData();
    formData.append('description', 'Test incident with location');
    formData.append('address', '123 Test Street, San Francisco, CA');
    formData.append('time', '12:00');
    formData.append('date', '2023-03-01');
    formData.append('latitude', '37.7749');
    formData.append('longitude', '-122.4194');

    console.log('Posting incident...');
    const postResponse = await fetch('http://localhost:3000/api/incidents', {
      method: 'POST',
      body: formData,
    });

    const postResult = await postResponse.json();
    console.log('POST result:', postResult);

    if (!postResult.success) {
      console.error('Failed to create incident');
      return;
    }

    // Then, query for incidents near that location
    console.log('Fetching incidents near the location...');
    const getResponse = await fetch('http://localhost:3000/api/incidents?lat=37.7749&lng=-122.4194&zoom=12');
    const getResult = await getResponse.json();
    console.log('GET result:', getResult);
    console.log('Number of incidents found:', getResult.incidents?.length || 0);
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Auto-execute the test function
testIncident(); 