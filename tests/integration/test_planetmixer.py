from gltest import get_contract_factory, create_account
from gltest.assertions import tx_execution_succeeded

RARITIES = ("COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC")


def test_fusion_consensus():
    factory = get_contract_factory("PlanetMixer")
    contract = factory.deploy(args=[])

    assert contract.is_discovered(args=["Ocean", "Fire"]).call() is False

    # The AI consensus write: fusing two worlds mints a canonical hybrid whose
    # rarity must match across validators and whose power agrees within tolerance.
    player = create_account()
    rc = contract.connect(player).fuse(args=["Ocean", "Fire"]).transact()
    assert tx_execution_succeeded(rc)

    assert contract.is_discovered(args=["Fire", "Ocean"]).call() is True

    stats = contract.get_stats(args=[]).call()
    assert int(stats["discoveries"]) == 1
    assert int(stats["fusions"]) == 1

    planets = contract.get_planets(args=[0]).call()
    assert len(planets) == 1
    p = planets[0]
    assert p["rarity"] in RARITIES
    assert 0 <= int(p["power"]) <= 100
    assert len(p["name"]) > 0
    assert p["discoverer"] != ""
