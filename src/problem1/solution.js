// Assuming this input will always produce a result lesser than Number.MAX_SAFE_INTEGER

var sum_to_n_a = function(n) {
    var total = 0;
    for (var i = 1; i <= n; i++) {
        total += i;
    }
    return total;
};

var sum_to_n_b = function(n) {
    if (n <= 0) return 0;
    return n % 2 === 0 ? (n / 2) * (n + 1) : n * ((n + 1) / 2);
};

var sum_to_n_c = function(n) {
    function sumRange(start, end) {
        if (start > end) return 0;
        if (start === end) return start;
        var middle = start + Math.floor((end - start) / 2);
        return sumRange(start, middle) + sumRange(middle + 1, end);
    }
    return sumRange(1, n);
};
