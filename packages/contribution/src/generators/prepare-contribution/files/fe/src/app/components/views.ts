import React from "react";
import FleetManagementCarList from "@frontend/app/components/fleet-management/views/car-list";
import FleetManagementCar from "@frontend/app/components/fleet-management/views/car";
import CoreWelcome from "@frontend/app/components/core/welcome";

export type ViewRegistry = {[valueObjectName: string]: React.FunctionComponent<any>}

export const views: ViewRegistry = {
  "Core.Welcome": CoreWelcome,
  "FleetManagement.CarList": FleetManagementCarList,
  "FleetManagement.Car": FleetManagementCar
};
