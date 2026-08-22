/**
 * Alcheminds Phase 3: Spatial Clustering, Civic Hotspot Engine, and Pattern Detection ("The Bigger Picture")
 */

// Haversine distance in kilometers between two GPS coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cluster raw reports into geographic groups within a specified radius (default: 0.8 km)
 */
export function clusterReportsByProximity(reports, radiusKm = 0.8) {
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < reports.length; i++) {
    if (visited.has(reports[i].id)) continue;

    const cluster = [reports[i]];
    visited.add(reports[i].id);

    for (let j = i + 1; j < reports.length; j++) {
      if (visited.has(reports[j].id)) continue;

      const dist = calculateDistanceKm(
        reports[i].latitude,
        reports[i].longitude,
        reports[j].latitude,
        reports[j].longitude
      );

      if (dist <= radiusKm) {
        cluster.push(reports[j]);
        visited.add(reports[j].id);
      }
    }

    // Calculate cluster center
    const avgLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length;

    // Aggregate categories & severities
    const categoryCounts = {};
    const severityCounts = { Low: 0, Moderate: 0, Serious: 0, Dangerous: 0 };
    let totalPriority = 0;

    cluster.forEach((r) => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      if (severityCounts[r.severity] !== undefined) {
        severityCounts[r.severity]++;
      }
      totalPriority += r.civic_priority_score || 50;
    });

    const dominantCategory = Object.keys(categoryCounts).reduce((a, b) =>
      categoryCounts[a] > categoryCounts[b] ? a : b
    );

    clusters.push({
      id: `cluster_${i}_${Date.now()}`,
      center: { latitude: avgLat, longitude: avgLng },
      count: cluster.length,
      reports: cluster,
      dominantCategory,
      categoryCounts,
      severityCounts,
      avgPriorityScore: Math.round(totalPriority / cluster.length),
    });
  }

  return clusters;
}

/**
 * Detect Civic Hotspots from clusters
 * Criteria: >= 3 reports OR recurring complaints with high severity within a tight area
 */
export function detectCivicHotspots(reports) {
  const rawClusters = clusterReportsByProximity(reports, 1.2);
  const hotspots = [];

  rawClusters.forEach((cluster, idx) => {
    if (cluster.count < 3 && cluster.avgPriorityScore < 70) return;

    // Calculate date span / recurrence
    const timestamps = cluster.reports.map((r) => new Date(r.created_at).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const daysSpan = Math.max(1, Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)));

    // Calculate unique communities / addresses
    const uniqueLocations = new Set(
      cluster.reports.map((r) => r.address || `${r.latitude.toFixed(3)},${r.longitude.toFixed(3)}`)
    );

    // Determine trend based on report creation timing
    const now = Date.now();
    const recentCount = cluster.reports.filter(
      (r) => now - new Date(r.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    let trend = 'Stabilizing';
    if (recentCount >= cluster.count * 0.6 || cluster.count >= 6) {
      trend = 'Increasing';
    }
    if (cluster.severityCounts.Dangerous > 0 || cluster.avgPriorityScore >= 80) {
      trend = 'Critical';
    }

    // Generate descriptive name
    const dominantCat = cluster.dominantCategory;
    const sampleAddress = cluster.reports[0]?.address || 'Municipal Zone';
    const zoneName = sampleAddress.split(',')[0].trim();

    hotspots.push({
      id: `hotspot_${idx}_${Date.now()}`,
      name: `${zoneName} ${dominantCat} Hotspot`,
      dominantCategory: dominantCat,
      center: cluster.center,
      radiusMeters: Math.min(1200, Math.max(350, cluster.count * 90)),
      reportCount: cluster.count,
      communitiesImpacted: Math.max(1, uniqueLocations.size),
      recurrenceDays: `${daysSpan}-day recurrence`,
      trend,
      avgPriorityScore: cluster.avgPriorityScore,
      reports: cluster.reports.map((r) => ({
        id: r.id,
        code: r.report_code,
        category: r.category,
        severity: r.severity,
        status: r.status,
        description: r.description,
        latitude: r.latitude,
        longitude: r.longitude,
        created_at: r.created_at,
      })),
      categoryBreakdown: cluster.categoryCounts,
    });
  });

  // Sort hotspots by severity and report count
  return hotspots.sort((a, b) => b.reportCount * b.avgPriorityScore - a.reportCount * a.avgPriorityScore);
}

/**
 * Phase 3 "The Bigger Picture": Problem Genome Systemic Pattern Detection
 * Correlates multi-category reports in close spatial proximity and synthesizes underlying infrastructure failure hypotheses.
 */
export function detectSystemicPatterns(reports) {
  const clusters = clusterReportsByProximity(reports, 1.5);
  const patterns = [];

  clusters.forEach((cluster, idx) => {
    if (cluster.count < 3) return;

    const categories = Object.keys(cluster.categoryCounts);
    const hasWater = cluster.categoryCounts['Water'] > 0;
    const hasRoads = cluster.categoryCounts['Roads'] > 0;
    const hasSanitation = cluster.categoryCounts['Sanitation'] > 0;
    const hasElectricity = cluster.categoryCounts['Electricity'] > 0;
    const hasSchools = cluster.categoryCounts['Schools'] > 0;

    let patternTitle = '';
    let underlyingHypothesis = '';
    let systemicRecommendation = '';
    let confidenceScore = 0.75;
    const symptoms = [];

    if (hasWater && hasRoads && hasSanitation) {
      patternTitle = 'Correlated Stormwater & Arterial Drainage System Collapse';
      underlyingHypothesis =
        'Heavy silt deposition in sub-surface stormwater channels causes rapid street waterlogging, which erodes road bitumen foundations and triggers surface sewer line backflows.';
      systemicRecommendation =
        'Execute a unified arterial desilting and reinforced box-culvert rebuild rather than individual isolated pothole repairs or surface drain clearing.';
      confidenceScore = 0.92;
      symptoms.push('Surface Waterlogging', 'Bitumen Potholes & Road Cracking', 'Manhole Overflows');
    } else if (hasWater && hasRoads) {
      patternTitle = 'Road Sub-base Hydro-Degradation';
      underlyingHypothesis =
        'Inadequate storm runoff camber causes water retention at road shoulders, rapidly accelerating pothole formation and structural road decay.';
      systemicRecommendation =
        'Regrade road slope gradient and install continuous edge-drainage channels alongside pavement resurfacing.';
      confidenceScore = 0.86;
      symptoms.push('Puddle Accumulation', 'Pavement Potholes', 'Curb Submersion');
    } else if (hasElectricity && hasWater) {
      patternTitle = 'Hazardous Utility Conduit Inundation';
      underlyingHypothesis =
        'Water runoff incursion into underground or ground-level electrical junction boxes during high-moisture periods, causing localized phase trips and street hazard.';
      systemicRecommendation =
        'Elevate transformer plinths and waterproof underground conduit junctions in coordination between Power Distribution and Stormwater utilities.';
      confidenceScore = 0.89;
      symptoms.push('Voltage Fluctuations', 'Submerged Junction Boxes', 'Stagnant Water');
    } else if (hasSanitation && hasWater) {
      patternTitle = 'Civic Waste-Induced Drainage Choke';
      underlyingHypothesis =
        'Uncollected solid waste and plastic debris wash into open stormwater culverts, creating persistent localized blockages and vector breeding zones.';
      systemicRecommendation =
        'Deploy municipal trash-traps at major inlets and synchronize daily solid-waste pickups with monsoon de-silting schedules.';
      confidenceScore = 0.88;
      symptoms.push('Blocked Drainage', 'Debris Accumulation', 'Foul Odor / Vector Risk');
    } else if (cluster.count >= 4) {
      patternTitle = `Localized Infrastructure Fatigue (${cluster.dominantCategory})`;
      underlyingHypothesis = `Unusually high frequency of recurring ${cluster.dominantCategory.toLowerCase()} failures within a 1.5km zone indicates systemic material wear or deferred municipal maintenance.`;
      systemicRecommendation = `Commission a comprehensive zonal audit for ${cluster.dominantCategory} rather than piecemeal reactive work orders.`;
      confidenceScore = 0.78;
      symptoms.push(`Multiple ${cluster.dominantCategory} Incidents`, 'Frequent Citizen Resubmissions');
    }

    if (patternTitle) {
      const sampleAddress = cluster.reports[0]?.address || 'Municipal Ward';
      const wardName = sampleAddress.split(',')[0].trim();

      patterns.push({
        id: `pattern_${idx}_${Date.now()}`,
        title: patternTitle,
        zoneName: wardName,
        center: cluster.center,
        connectedReportsCount: cluster.count,
        connectedCategories: categories,
        symptoms,
        underlyingHypothesis,
        systemicRecommendation,
        confidenceScore,
        isHypothesis: true, // Clearly explicitly designated as a potential pattern hypothesis
        connectedReportIds: cluster.reports.map((r) => r.id),
        connectedReports: cluster.reports.map((r) => ({
          id: r.id,
          code: r.report_code,
          category: r.category,
          severity: r.severity,
          status: r.status,
          description: r.description,
          created_at: r.created_at,
        })),
      });
    }
  });

  return patterns;
}
