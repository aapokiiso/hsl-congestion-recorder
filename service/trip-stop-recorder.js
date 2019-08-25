'use strict';

const { db } = require('@aapokiiso/hsl-congestion-db-schema');
const CouldNotSaveTripStopError = require('../error/could-not-save-trip-stop-error');

module.exports = {
    /**
     * Records a trip stop status to the database:
     * where and when the tram stopped, and did it have its doors open.
     *
     * @param {string} tripId
     * @param {string} stopId
     * @param {Date} seenAtStop
     * @param {boolean} hasDoorsOpen
     * @returns {Promise<object>}
     */
    async recordTripStop(tripId, stopId, seenAtStop, hasDoorsOpen) {
        try {
            return await db().models.TripStop.create({
                tripId,
                stopId,
                seenAtStop,
                doorsOpen: hasDoorsOpen,
            });
        } catch (e) {
            throw new CouldNotSaveTripStopError(
                `Failed to record trip stop. Reason: ${e.message}`
            );
        }
    },
};
