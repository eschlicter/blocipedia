
const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/wikis/";
const sequelize = require("../../src/db/models/index").sequelize;
const Wiki = require("../../src/db/models").Wiki;
const User = require("../../src/db/models").User;

describe("routes : wikis", () => {

    beforeEach((done) => {
        this.user;
        this.wiki;
        sequelize.sync({force: true}).then((res) => {
            User.create({
                username: "UserExample",
                email: "user@example.com",
                password: "1234567890",
                role: "standard"
            })
            .then((user) => {
                this.user = user;
                request.get({
                    url: "http://localhost:3000/auth/fake",
                    form: {
                        role: user.role,
                        userId: user.id,
                        email: user.email
                    }
                });
                Wiki.create({
                    title: "Test Wiki",
                    body: "This is the wiki body.",
                    userId: user.id
                })
                .then((wiki) => {
                    this.wiki = wiki;
                    done();
                })
                .catch((err) => {
                    console.log(err);
                    done();
                })
            })
            .catch((err) => {
                console.log(err);
                done();
            })
        });
    });

    describe("GET /wikis", () => {
        it("should render the wiki index page", (done) => {
            request.get(base, (err, res, body) => {
                expect(err).toBeNull();
                expect(body).toContain("Wikis");
                done();
            });
        });
    });

    describe("GET /wikis/new", () => {
        it("should render a new wiki form", (done) => {
            request.get(`${base}new`, (err, res, body)=> {
                expect(err).toBeNull();
                
                done();
            });
        });
    });

    describe("POST /wikis/create", () => {
        it("should create a new wiki and redirect", (done) => {
          const options = {
            url: `${base}create`,
            form: {
              title: "blink-182 songs",
              body: "What's your favorite blink-182 song?",
              private: true,
              userId: this.user.id
            }
          };
          request.post(options,
            (err, res, body) => {
              console.log("wikis_spec2 "+res);
              console.log("wikis_spec3 "+body);
              Wiki.findOne({where: {title: "blink-182 songs"}})
              .then((wiki) => {
                expect(wiki.title).toBe("blink-182 songs");
                expect(wiki.body).toBe("What's your favorite blink-182 song?");
                done();
              })
              .catch((err) => {
                console.log(err);
                done();
              });
            }
          );
        });
      });

      describe("GET /wikis/:id", () => {
          it("should render a view with the selected wiki", (done) => {
              request.get(`${base}${this.wiki.id}`, (err, res, body) => {
                  expect(err).toBeNull();
                  expect(body).toContain("Test Wiki");
                  done();
              });
          });
      });

      describe("POST /wikis/:id/destroy", () => {
          it("should delete the wiki with the associated ID", (done) => {
              Wiki.all()
              .then((wikis) => {
                  const wikiCountBeforeDelete = wikis.length;
                  expect(wikiCountBeforeDelete).toBe(1);
                  request.post(`${base}${this.wiki.id}/destroy`, (err, res, body) => {
                      Wiki.all()
                      .then((wikis) => {
                          expect(err).toBeNull();
                          expect(wikis.length).toBe(wikiCountBeforeDelete -1);
                          done();
                      })
                      .catch((err) => {
                          console.log(err);
                          done();
                      })
                  });
              })
          });
      });

      describe("POST /wikis/:id/update", () => {
        it("should update the wiki with the given values", (done) => {
          request.post({
            url: `${base}${this.wiki.id}/update`,
            form: {
              title: "JavaScript Frameworks",
              body: "There are a lot of them",
              userId: this.user.id
            }
          }, (err, res, body) => {
            expect(err).toBeNull();
            Wiki.findOne({
              where: {id:1}
            })
            .then((wiki) => {
              expect(wiki.title).toBe("JavaScript Frameworks");
              done();
            })
            .catch((err) => {
              console.log(err);
              done();
            });
          });
        });
      });

});
