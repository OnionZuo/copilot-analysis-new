var _HeaderContributors = class _HeaderContributors {
  constructor() {
    this.contributors = [];
  }
  add(contributor) {
    this.contributors.push(contributor);
  }
  remove(contributor) {
    let index = this.contributors.indexOf(contributor);
    index !== -1 && this.contributors.splice(index, 1);
  }
  contributeHeaders(url, headers) {
    for (let contributor of this.contributors) contributor.contributeHeaderValues(url, headers);
  }
  size() {
    return this.contributors.length;
  }
};

,__name(_HeaderContributors, "HeaderContributors");

,var HeaderContributors = _HeaderContributors;