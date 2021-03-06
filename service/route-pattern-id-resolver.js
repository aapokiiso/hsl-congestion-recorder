'use strict';

const hslUtils = require('@aapokiiso/hsl-congestion-utils');
const hslGraphQL = require('@aapokiiso/hsl-congestion-graphql-gateway');
const RoutePatternIdNotFoundError = require('../error/route-pattern-id-not-found-error');
const RemoteServiceUnavailableError = require('../error/remote-service-unavailable-error');

module.exports = {
    /**
     * Resolves departure details gathered from the Realtime API payload
     * into a GTFS route pattern ID from the Routing API.
     *
     * @param {string} routeId
     * @param {number} directionId
     * @param {string} departureDate - yyyy-mm-dd
     * @param {number} departureTimeSeconds - seconds since start of day
     * @returns {Promise<string>}
     * @throws RoutePatternIdNotFoundError
     * @throws RemoteServiceUnavailableError
     */
    async findIdByDeparture(routeId, directionId, departureDate, departureTimeSeconds) {
        const routeGtfsId = hslUtils.gtfsId.convertRealtimeApiForRoutingApi(routeId);

        try {
            return await searchRoutePatternIdFromApi(
                routeGtfsId,
                directionId,
                departureDate,
                departureTimeSeconds
            );
        } catch (e) {
            if (e instanceof RoutePatternIdNotFoundError) {
                throw e;
            }

            throw new RemoteServiceUnavailableError(
                `Failed to find route pattern ID from HSL GraphQL API. Reason: '${e.message}'`
            );
        }
    },
};

async function searchRoutePatternIdFromApi(routeGtfsId, directionId, departureDate, departureTimeSeconds) {
    const { fuzzyTrip: trip } = await hslGraphQL.query(
        `{
                fuzzyTrip(route: "${routeGtfsId}", direction: ${directionId}, date: "${departureDate}", time: ${departureTimeSeconds}) {
                    pattern {
                        code
                    }
                }
            }`
    );

    if (!trip) {
        throw new RoutePatternIdNotFoundError(
            `Trip details not found for route ID ${routeGtfsId}, direction ${directionId}, departure date ${departureDate}, departure time ${departureTimeSeconds}`
        );
    }

    const { code: routePatternId } = trip.pattern;

    return routePatternId;
}
