Feature: Add Car To Fleet
  Scenario: Add Car To Fleet
    Given Car Added
    Given Car Added To Fleet
    When Add Car To Fleet
    Then Incomplete Car Added

