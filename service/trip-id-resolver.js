'use strict';

const hslUtils = require('@aapokiiso/hsl-congestion-utils');
const hslGraphQL = require('@aapokiiso/hsl-congestion-graphql-gateway');
const TripIdNotFoundError = require('../error/trip-id-not-found-error');
const RemoteServiceUnavailableError = require('../error/remote-service-unavailable-error');

module.exports = {
    /**
     * Resolves departure details gathered from the Realtime API payload
     * into a GTFS trip ID from the Routing API.
     *
     * @param {string} routeId
     * @param {number} directionId
     * @param {string} departureDate - yyyy-mm-dd
     * @param {number} departureTimeSeconds - seconds since start of day
     * @returns {Promise<string>}
     * @throws TripIdNotFoundError
     * @throws RemoteServiceUnavailableError
     */
    async findIdByDeparture(routeId, directionId, departureDate, departureTimeSeconds) {
        const routeGtfsId = hslUtils.gtfsId.convertRealtimeApiForRoutingApi(routeId);

        try {
            return await searchTripIdFromApi(
                routeGtfsId,
                directionId,
                departureDate,
                departureTimeSeconds
            );
        } catch (e) {
            if (e instanceof TripIdNotFoundError) {
                throw e;
            }

            throw new RemoteServiceUnavailableError(
                `Failed to find trip ID from HSL GraphQL API. Reason: '${e.message}'`
            );
        }
    },
};

async function searchTripIdFromApi(routeGtfsId, directionId, departureDate, departureTimeSeconds) {
    const { fuzzyTrip: trip } = await hslGraphQL.query(`{
                fuzzyTrip(route: "${routeGtfsId}", direction: ${directionId}, date: "${departureDate}", time: ${departureTimeSeconds}) {
                    gtfsId
                }
            }`);

    if (!trip) {
        throw new TripIdNotFoundError(
            `Trip details not found for route ID ${routeGtfsId}, direction ${directionId}, departure date ${departureDate}, departure time ${departureTimeSeconds}`
        );
    }

    const { gtfsId: tripId } = trip;

    return tripId;
}
