const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function fetchJson(url) {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

async function fetchAllData(baseUrl) {
  const allData = [];
  let nextUrl = baseUrl;
  
  while (nextUrl) {
    const response = await fetchJson(nextUrl);
    allData.push(...response.data);
    nextUrl = response.links.next;
  }
  
  return allData;
}

async function fetchTopWorkplaces() {
  try {
    const workplaces = await fetchAllData(`${API_BASE_URL}/workplaces`);
    const shifts = await fetchAllData(`${API_BASE_URL}/shifts`);
    
    const now = new Date();
    const completedShifts = shifts.filter(shift => 
      shift.workerId !== null && 
      shift.workerId !== undefined &&
      !shift.cancelledAt &&
      new Date(shift.endAt) <= now
    );

    const shiftCounts = new Map();
    completedShifts.forEach(shift => {
      const currentCount = shiftCounts.get(shift.workplaceId) || 0;
      shiftCounts.set(shift.workplaceId, currentCount + 1);
    });

    const workplaceShiftCounts = workplaces
      .map(workplace => ({
        name: workplace.name,
        shifts: shiftCounts.get(workplace.id) || 0
      }))
      .filter(workplace => workplace.shifts > 0)
      .sort((a, b) => b.shifts - a.shifts)
      .slice(0, 3);

    console.log(workplaceShiftCounts);

  } catch (error) {
    console.error('Error fetching top workplaces:', error);
    process.exit(1);
  }
}

fetchTopWorkplaces();