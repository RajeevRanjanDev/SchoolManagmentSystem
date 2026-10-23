package com.sms.school.service;

import com.sms.school.dto.request.UpdateBusLocationRequest;
import com.sms.school.dto.response.BusLocationResponse;

public interface BusTrackingService {

    /** Called by the driver app to push a new GPS location */
    BusLocationResponse updateLocation(Long schoolId, UpdateBusLocationRequest request);

    /** Returns the latest known location of a vehicle */
    BusLocationResponse getLiveLocation(Long schoolId, Long vehicleId);
}
