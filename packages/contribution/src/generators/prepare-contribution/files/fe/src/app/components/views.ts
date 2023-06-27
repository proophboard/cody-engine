import React from "react";
import CoreWelcome from "@frontend/app/components/core/welcome";
import FleetManagementCarList from "@frontend/app/components/fleet-management/views/CarList";
import FleetManagementCar from "@frontend/app/components/fleet-management/views/Car";

export type ViewRegistry = {[valueObjectName: string]: React.FunctionComponent<any>}

export const views: ViewRegistry = {
  "Core.Welcome": CoreWelcome,
  "FleetManagement.CarList": FleetManagementCarList,
  "FleetManagement.Car": FleetManagementCar
};
