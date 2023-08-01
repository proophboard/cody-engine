Feature: Add Car To Fleet
  Scenario: Add A BMW to the Fleet
    Given car is BMW model 1er
    When I add the car to the fleet
    Then an incomplete car should be added

