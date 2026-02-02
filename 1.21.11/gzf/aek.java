import java.util.Optional;

public record aek(ftm b, float c, int d, Optional<ftm> e, lw f, jd<bcz> g, cbn<lt> h) implements aay<adb> {
   public static final aao<xq, aek> a;

   public aek(ftm param1, float param2, int param3, Optional<ftm> param4, lw param5, jd<bcz> param6, cbn<lt> param7) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
      this.g = $$5;
      this.h = $$6;
   }

   public aba<aek> a() {
      return ahz.I;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public ftm b() {
      return this.b;
   }

   public float e() {
      return this.c;
   }

   public int f() {
      return this.d;
   }

   public Optional<ftm> g() {
      return this.e;
   }

   public lw h() {
      return this.f;
   }

   public jd<bcz> i() {
      return this.g;
   }

   public cbn<lt> j() {
      return this.h;
   }

   static {
      a = aao.a(ftm.b, aek::b, aam.l, aek::e, aam.g, aek::f, ftm.b.a(aam::a), aek::g, ly.bm, aek::h, bcz.d, aek::i, cbn.a(lt.b), aek::j, aek::new);
   }
}
