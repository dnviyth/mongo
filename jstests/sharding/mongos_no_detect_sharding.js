// Tests whether new sharding is detected on insert by mongos
(function() {

    var st = new ShardingTest({name: "mongos_no_detect_sharding", shards: 1, mongos: 2});

    var mongos = st.s;
    var config = mongos.getDB("config");

    print("Creating unsharded connection...");

    var mongos2 = st._mongos[1];

    var coll = mongos2.getCollection("test.foo");
    coll.insert({i: 0});

    print("Sharding collection...");

    var admin = mongos.getDB("admin");

    assert.eq(coll.getShardVersion().ok, 0);

    admin.runCommand({enableSharding: "test"});
    admin.runCommand({shardCollection: "test.foo", key: {_id: 1}});

    print("Seeing if data gets inserted unsharded...");
    print("No splits occur here!");

    // Insert a bunch of data which should trigger a split
    var bulk = coll.initializeUnorderedBulkOp();
    for (var i = 0; i < 100; i++) {
        bulk.insert({i: i + 1});
    }
    assert.writeOK(bulk.execute());

    st.printShardingStatus(true);

    assert.eq(coll.getShardVersion().ok, 1);
    assert.eq(101, coll.find().itcount());

    st.stop();

})();
