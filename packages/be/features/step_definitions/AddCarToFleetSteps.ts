import { binding, given, then, when } from "cucumber-tsflow";

@binding()
class AddCarToFleetSteps {
  @given('car is BMW model 1er')
  public givenCarWithBrandAndModel (): string {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
  }

  @when(/I add the car to the fleet/)
  public addsCarToFleet(): string {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
  }

  @then(/an incomplete car should be added/)
  public thenIncompleteCarAdded(): string {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
  }
}

export = AddCarToFleetSteps;
