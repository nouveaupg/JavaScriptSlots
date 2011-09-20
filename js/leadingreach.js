(function(window) {

    var Gitana = window.Gitana;

    LeadingReach = Gitana.Context.extend(
    /** @lends LeadingReach.prototype */
    {
        /**
         * @constructs
         *
         * @class Abstract base class for LeadingReach services and objects.
         */
        constructor: function(configs) {
            this.base(configs);

            var self = this;

            // instance cache
            // NOTE: store this in a map so that we don't lose pointer when wrapping in a proxy
            if (!this.cache) {
                this.cache = {};
            }
            this.cache["scope"] = null;
            this.cache["application"] = null;
            this.cache["surface"] = null;
            this.cache["session"] = null;
            this.cache["visitors"] = null;

            this.surfaceConfigs = configs['surface'];
            if (this.surfaceConfigs && this.surfaceConfigs.objectType && this.surfaceConfigs.objectType == 'Gitana:Node') {
                this.cache.surface = this.surfaceConfigs;
                this.cache.surface = this.surfaceConfigs.getId();
            } else if (typeof this.surfaceConfigs == "string") {
                this.surfaceConfigs = {
                    "_doc" : this.surfaceConfigs
                };
            } else {
                this.surfaceConfigs["_type"] = "leadingreach:surface";
            }
        },

        /**
         * Initializes the leading reach object and caches all context objects.
         * This should get called before any other methods.
         *
         * This hands back a chained version of the leading reach object.
         *
         * @chained leading reach
         */
        init: function () {

            // call parent init() function
            var result = this.base();

            var self = this;

            return result.then(function() {

                var loadSurface = function(successCallback, errorCallback)
                {
                    if (!self.surface())
                    {
                        self.branch().trap(function(error) {
                            if (errorCallback) {
                                errorCallback({
                                    'message': 'Failed to get surface',
                                    'error': error
                                });
                            }
                        }).queryNodes(self.surfaceConfigs).count(function(count) {
                            if (errorCallback) {
                                if (count == 0) {
                                    errorCallback({
                                        'message': 'Cannot find any surface'
                                    });
                                }
                                if (count > 1) {
                                    errorCallback({
                                        'message': 'Found more than one surface'
                                    });
                                }
                            }
                        }).keepOne().then(function() {

                            self.surface(this);

                            // proceed to application
                            loadApplication(successCallback, errorCallback);
                        });
                    }
                    else
                    {
                        loadApplication(successCallback, errorCallback);
                    }
                };

                var loadApplication = function(successCallback, errorCallback)
                {
                    if (!self.application())
                    {
                        self.surface().trap( function(error) {
                            if (errorCallback) {
                                errorCallback({
                                    'message': 'Failed to get application',
                                    'error': error
                                });
                            }
                        }).traverse({
                            "associations": {
                                "leadingreach:hasSurface": "INCOMING"
                            }
                        }).nodes().keepOne().then(function() {

                            self.application(this);

                            // proceed to scope
                            loadScope(successCallback, errorCallback);
                        });
                    }
                    else
                    {
                        loadScope(successCallback, errorCallback);
                    }
                };

                var loadScope = function(successCallback, errorCallback)
                {
                    if (!self.scope())
                    {
                        self.application().trap( function(error) {
                            if (errorCallback) {
                                errorCallback({
                                    'message': 'Failed to get application',
                                    'error': error
                                });
                            }
                        }).traverse({
                            "associations": {
                                "leadingreach:hasApplication": "INCOMING"
                            }
                        }).nodes().keepOne().then(function() {

                            self.scope(this);

                            // all done
                            successCallback.call();
                        });
                    }
                    else
                    {
                        successCallback.call();
                    }
                };

                // preload some work onto the chain
                this.subchain().then(function() {

                    var chain = this;

                    loadSurface(function() {

                        // success
                        chain.next();

                    }, function(err) {

                        // failure
                        var errorCallback = self.getConfigs()['error'];
                        errorCallback(err);
                    });

                    // return false so that the chain waits for us to manually kick it
                    return false;
                });
            });
        },

        scope: function(scope)
        {
            if (scope || scope === null) {
                this.cache.scope = scope;
            }

            return this.cache.scope ? Chain(this.cache.scope) : null;
        },

        application: function(application)
        {
            if (application || application === null) {
                this.cache.application = application;
            }

            return this.cache.application ? Chain(this.cache.application) : null;
        },

        surface: function(surface)
        {
            if (surface || surface === null) {
                this.cache.surface = surface;
            }

            return this.cache.surface ? Chain(this.cache.surface) : null;
        },

        session: function(session)
        {
            if (session || session === null) {
                this.cache.session = session;
            }

            return this.cache.session ? Chain(this.cache.session) : null;
        },

        visitors: function(visitors)
        {
            if (visitors || visitors === null) {
                this.cache.visitors = visitors;
            }

            return this.cache.visitors ? Chain(this.cache.visitors) : null;
        },

        /**
         * Starts a new session.
         *
         * This gets called when the person taps on the kiosk screensaver to begin using the machine.
         *
         * @chained leadingReach object
         *
         * @param object optional json
         */
        startSession: function(object) {

            var self = this;

            if (!object) {
                object = {};
            }
            object["_type"] = "leadingreach:session";
            object["ended"] = false;

            // return the leading reach object (new chain)
            return Chain(this).then(function() {

                this.subchain(self.branch()).then(function() {

                    // NOTE: this = branch

                    // make sure the session has the following properties
                    object["scopeId"] = self.scope().getId();
                    object["applicationId"] = self.application().getId();
                    object["surfaceId"] = self.surface().getId();

                    // create the session
                    this.createNode(object).then(function() {

                        // NOTE: this = session

                        self.session(this);
                    });

                    // additional set up for session
                    this.then(function() {

                        // create a "leadingreach:hasSession" association between the application and the session

                        self.application().associate(self.session(), "leadingreach:hasSession").then(function() {

                            // TODO: anything else?

                        });
                    });
                });
            });
        },

        /**
         * Adds an unknown participant to the session.
         *
         * @chained leadingReach object
         *
         * @param object optional json data
         *
         * @returns person object
         */
        addUnknownVisitor: function(object) {

            var self = this;

            // return the leading reach object
            return this.then(function() {

                this.subchain(self.branch()).then(function() {

                    // NOTE: this = branch

                    // create a temporary user
                    var tempUser = null;
                    this.subchain(self.server()).then(function() {

                        // NOTE: this = server

                        this.createUser("user-" + new Date().getTime()).then(function(){
                            tempUser = this;
                        });
                    });

                    // create a person and associate person to session
                    var tempPerson = null;
                    this.then(function() {
                        this.readPerson(tempUser.getPrincipalId(), true).then(function() {
                            tempPerson = this;

                            // update with properties from the object if applicable
                            if (object && object.email)
                            {
                                this.set("email", object.email);
                                this.update();
                            }

                            // associate to session
                            this.associate(self.session(), "leadingreach:participatesInSession");

                            // associate with application (application -> participant for type "leadingreach:hasParticipant")
                            this.associateOf(self.application(), "leadingreach:hasParticipant");
                        });
                    });

                    // anything else we have to do
                    // load the result with the person (which is what we're handing back)
                    this.then(function() {

                        // TODO: store object data onto "visitor" holder on session?

                        // invalidate any local cache
                        self.visitors(null);
                    });
                });
            });
        },

        /**
         * Adds an existing user to the session
         *
         * @chained leadingReach object
         *
         * @param userId the user id
         *
         * @returns person object
         */
        addVisitor: function(userId) {

            var self = this;

            // return the leading reach object
            return this.then(function() {

                this.subchain(self.branch()).then(function() {

                    // NOTE: this = branch

                    // read the person
                    // associate to session
                    var person = null;
                    this.readPerson(userId, true).then(function() {

                        // NOTE: this = person
                        person = this;

                        // associate to session
                        this.associate(self.session(), "leadingreach:participatesInSession");

                        // associate with application (application -> participant for type "leadingreach:hasParticipant")
                        this.associateOf(self.application(), "leadingreach:hasParticipant");
                    });

                    // anything else we have to do
                    // load the result with the person (which is what we're handing back)
                    this.then(function() {

                        // TODO: store object data onto "visitor" holder on session?

                        // invalidate any local cache
                        self.visitors(null);
                    });
                });
            });
        },

        /**
         * Ends a session.
         *
         * This should get called when a session is being ended or reset.
         *
         * @chained leadingReach object
         *
         * @param timedOut boolean whether the session timed out
         */
        endSession: function(timedOut)
        {
            var self = this;

            // return the leading reach object
            return this.then(function() {

                // create session ended associations for each participant
                this.then(function() {

                    this.listParticipants().each(function() {

                        // NOTE: this = person

                        this.associate(self.session(), "leadingreach:sessionEnded").then(function() {

                            // NOTE: this = association

                            if (timedOut)
                            {
                                this.set("timedOut", timedOut);
                                this.update();
                            }
                        });
                    });
                });

                // remove the cached session
                this.then(function() {

                    // TODO: do we need to store "timestamp" information onto the session object?
                    // TODO: is this sessionEnded association recording the time when the person dropped out the session?

                    var session = self.session();
                    session.object['ended'] = true;
                    this.subchain(session).update().then(function() {

                        // end session
                        self.session(null);
                    });
                });

            });
        },

        /**
         * Call this method when an asset is clicked on
         *
         * @chained leadingReach object
         */
        signalViewedAsset: function(assetId)
        {
            var self = this;

            return this.then(function() {

                this.listParticipants().each(function() {

                    // NOTE: this = person

                    this.associate(assetId, {
                        "_type": "leadingreach:viewed",
                        "scopeId": self.scope().getId(),
                        "applicationId": self.application().getId(),
                        "surfaceId": self.surface().getId()
                    });

                });
            });
        },

        /**
         * Hands back a chainable map of participants for this session
         *
         * @chained node map (person)
         */
        listParticipants: function()
        {
            var self = this;

            // we'll hand back a map
            var result = this.subchain(new Gitana.NodeMap(this.branch()));

            // front-load our own work
            result.then(function() {

                if (self.visitors())
                {
                    result.handleResponse(self.visitors().object);
                }
                else
                {
                    this.subchain(self.session()).then(function() {

                        this.traverse({
                            "associations": {
                                "leadingreach:participatesInSession": "INCOMING"
                            }
                        }).nodes().then(function() {

                            self.visitors(this);

                            result.handleResponse(self.visitors().object);
                        });
                    });
                }
            });

            return result;
        },

        /**
         * Hands back a chainable map of assets for this surface
         *
         * @chained node map (node)
         */
        listAssets: function()
        {
            var self = this;
            // we'll hand back a map
            var result = this.subchain(new Gitana.NodeMap(this.branch()));

            // front-load our own work
            result.then(function() {
                this.subchain(self.application()).then(function() {
                    this.traverse({
                        "associations": {
                            "leadingreach:hasAsset": "OUTGOING"
                        },
                        "depth": 1
                    }).nodes().then(function() {
                        result.handleResponse(this.object);
                    });
                });
            });
            return result;
        },

        /**
         * Returns true if there is an active session
         */
        hasSession: function() {
            return this.session();
        }

    });

    /**
     * Helper function to create LR instances
     *
     * @param config
     */
    LeadingReach.create = function(config)
    {
        return new LeadingReach(config).init();
    };

    window.LeadingReach = LeadingReach;

})(window);