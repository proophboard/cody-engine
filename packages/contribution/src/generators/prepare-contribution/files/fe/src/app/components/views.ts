import React from "react";
import FleetManagementCarCarList from "@frontend/app/components/fleet-management/views/car/car-list";
import FleetManagementCarCar from "@frontend/app/components/fleet-management/views/car/car";
import CoreWelcome from "@frontend/app/components/core/welcome";

export type ViewRegistry = {[valueObjectName: string]: React.FunctionComponent<any>}

export const views: ViewRegistry = {
  "Core.Welcome": CoreWelcome,
  "FleetManagement.Car.CarList": FleetManagementCarCarList,
  "FleetManagement.Car.Car": FleetManagementCarCar
};
