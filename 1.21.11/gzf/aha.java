import java.util.Optional;

public record aha(String b, String c, int d, Optional<yh> e, Optional<aag> f) implements aay<adb> {
   public static final aao<xq, aha> a;

   public aha(String param1, String param2, int param3, Optional<yh> param4, Optional<aag> param5) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   public aba<aha> a() {
      return ahz.aU;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   public String e() {
      return this.c;
   }

   public int f() {
      return this.d;
   }

   public Optional<yh> g() {
      return this.e;
   }

   public Optional<aag> h() {
      return this.f;
   }

   static {
      a = aao.a(aam.p, aha::b, aam.p, aha::e, aam.h, aha::f, yj.e, aha::g, aai.d, aha::h, aha::new);
   }
}
