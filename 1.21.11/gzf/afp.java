import java.util.Set;

public record afp(int b, chy c, Set<chz> d) implements aay<adb> {
   public static final aao<wx, afp> a;

   public afp(int param1, chy param2, Set<chz> param3) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public static afp a(int $$0, chy $$1, Set<chz> $$2) {
      return new afp($$0, $$1, $$2);
   }

   public aba<afp> a() {
      return ahz.an;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public chy e() {
      return this.c;
   }

   public Set<chz> f() {
      return this.d;
   }

   static {
      a = aao.a(aam.h, afp::b, chy.a, afp::e, chz.m, afp::f, afp::new);
   }
}
