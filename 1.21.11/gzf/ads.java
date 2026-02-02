import com.mojang.brigadier.Message;
import com.mojang.brigadier.context.StringRange;
import com.mojang.brigadier.suggestion.Suggestion;
import com.mojang.brigadier.suggestion.Suggestions;
import java.util.List;
import java.util.Optional;

public record ads(int b, int c, int d, List<ads.a> e) implements aay<adb> {
   public static final aao<xq, ads> a;

   public ads(int $$0, Suggestions $$1) {
      this($$0, $$1.getRange().getStart(), $$1.getRange().getLength(), $$1.getList().stream().map(($$0x) -> {
         return new ads.a($$0x.getText(), Optional.ofNullable($$0x.getTooltip()).map(yk::a));
      }).toList());
   }

   public ads(int param1, int param2, int param3, List<ads.a> param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   public aba<ads> a() {
      return ahz.q;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public Suggestions b() {
      StringRange $$0 = StringRange.between(this.c, this.c + this.d);
      return new Suggestions($$0, this.e.stream().map(($$1) -> {
         return new Suggestion($$0, $$1.a(), (Message)$$1.b().orElse((Object)null));
      }).toList());
   }

   public int e() {
      return this.b;
   }

   public int f() {
      return this.c;
   }

   public int g() {
      return this.d;
   }

   public List<ads.a> h() {
      return this.e;
   }

   static {
      a = aao.a(aam.h, ads::e, aam.h, ads::f, aam.h, ads::g, ads.a.a.a(aam.a()), ads::h, ads::new);
   }

   public static record a(String b, Optional<yh> c) {
      public static final aao<xq, ads.a> a;

      public a(String param1, Optional<yh> param2) {
         this.b = $$0;
         this.c = $$1;
      }

      public String a() {
         return this.b;
      }

      public Optional<yh> b() {
         return this.c;
      }

      static {
         a = aao.a(aam.p, ads.a::a, yj.e, ads.a::b, ads.a::new);
      }
   }
}
